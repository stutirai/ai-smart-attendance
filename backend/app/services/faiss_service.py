import faiss
import numpy as np
import json
import os
from pathlib import Path
import logging
from typing import Optional, Tuple, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger("attendance.services.faiss")

class FAISSService:
    def __init__(self):
        self.dim = settings.EMBEDDING_DIM
        self.index_path = settings.FAISS_INDEX_PATH
        self.mapping_path = settings.FAISS_MAPPING_PATH
        
        # Mapping: faiss_id (int) -> student metadata dict
        self.mapping: Dict[int, Dict[str, Any]] = {}
        
        # Create IndexFlatIP (Inner Product = Cosine Similarity when vectors are L2-normalized)
        self.index = faiss.IndexFlatIP(self.dim)
        self._load_index()

    def _load_index(self):
        if os.path.exists(self.index_path) and os.path.exists(self.mapping_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.mapping_path, "r", encoding="utf-8") as f:
                    raw_mapping = json.load(f)
                    self.mapping = {int(k): v for k, v in raw_mapping.items()}
                logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors from {self.index_path}")
            except Exception as e:
                logger.error(f"Error loading FAISS index: {e}. Creating new index.")
                self.index = faiss.IndexFlatIP(self.dim)
                self.mapping = {}
        else:
            logger.info("Initializing new empty FAISS IndexFlatIP(512)")
            self.index = faiss.IndexFlatIP(self.dim)
            self.mapping = {}

    def save_index(self):
        try:
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
            faiss.write_index(self.index, self.index_path)
            with open(self.mapping_path, "w", encoding="utf-8") as f:
                json.dump(self.mapping, f, indent=2)
            logger.info(f"Saved FAISS index ({self.index.ntotal} vectors) and mapping.")
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")

    def add_embedding(self, embedding: np.ndarray, metadata: Dict[str, Any]) -> int:
        """
        Adds a 512-D L2-normalized embedding to the FAISS index.
        Returns the assigned faiss_id.
        """
        if embedding is None:
            raise ValueError("Embedding cannot be None")
        
        vec = np.array(embedding, dtype=np.float32).reshape(1, self.dim)
        faiss.normalize_L2(vec)

        faiss_id = self.index.ntotal
        self.index.add(vec)
        self.mapping[faiss_id] = metadata
        self.save_index()
        return faiss_id

    def search_face(self, embedding: np.ndarray, threshold: Optional[float] = None) -> Tuple[Optional[Dict[str, Any]], float]:
        """
        Searches the FAISS vector index for the closest registered identity.
        Uses cosine similarity (Inner Product on L2-normalized ArcFace vectors).
        
        If top score >= threshold: returns (student_metadata, similarity)
        If top score < threshold: returns (None, similarity) -> Classified as UNKNOWN
        """
        if threshold is None:
            threshold = settings.RECOGNITION_THRESHOLD

        if self.index.ntotal == 0:
            return None, 0.0

        vec = np.array(embedding, dtype=np.float32).reshape(1, self.dim)
        faiss.normalize_L2(vec)

        # Search nearest 1 match
        D, I = self.index.search(vec, k=1)
        similarity = float(D[0][0])
        match_id = int(I[0][0])

        if match_id == -1 or similarity < threshold:
            # Below threshold or empty match -> UNKNOWN (Never assign closest student arbitrarily!)
            return None, max(0.0, similarity)

        matched_student = self.mapping.get(match_id)
        return matched_student, similarity

    def reset_index(self):
        """Resets the FAISS index and clears the mapping."""
        self.index = faiss.IndexFlatIP(self.dim)
        self.mapping = {}
        self.save_index()
        logger.info("FAISS index reset.")

faiss_service = FAISSService()
