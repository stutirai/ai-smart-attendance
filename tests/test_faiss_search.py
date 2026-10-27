import sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.faiss_service import FAISSService
import faiss

def test_faiss_vector_search():
    service = FAISSService()
    service.reset_index()

    # Create dummy 512-D normalized vector for Stuti Rai
    vec_stuti = np.random.randn(512).astype(np.float32)
    faiss.normalize_L2(vec_stuti.reshape(1, 512))
    
    meta_stuti = {
        "student_id": 1,
        "student_code": "G10-060",
        "name": "Stuti Rai",
        "roll_number": "2401321630060"
    }
    service.add_embedding(vec_stuti, meta_stuti)

    # 1. Search with exact vector
    match, sim = service.search_face(vec_stuti, threshold=0.55)
    assert match is not None, "Exact vector should match"
    assert match["name"] == "Stuti Rai"
    assert sim > 0.99
    print(f"[PASS] Exact match found: {match['name']} (similarity: {sim:.4f})")

    # 2. Search with noisy vector (camera variance: sigma=0.01)
    noisy_vec = vec_stuti + np.random.normal(0, 0.01, size=512).astype(np.float32)
    faiss.normalize_L2(noisy_vec.reshape(1, 512))
    match_noisy, sim_noisy = service.search_face(noisy_vec, threshold=0.55)
    assert match_noisy is not None
    assert match_noisy["name"] == "Stuti Rai"
    assert sim_noisy > 0.80, f"Expected > 0.80, got {sim_noisy}"
    print(f"[PASS] Noisy query matched: {match_noisy['name']} (similarity: {sim_noisy:.4f})")

    # 3. Search with random orthogonal vector (Unknown Face)
    random_vec = np.random.randn(512).astype(np.float32)
    faiss.normalize_L2(random_vec.reshape(1, 512))
    match_unknown, sim_unknown = service.search_face(random_vec, threshold=0.55)
    assert match_unknown is None, f"Unknown face must be rejected, got {match_unknown}"
    print(f"[PASS] Unknown face correctly rejected (similarity: {sim_unknown:.4f} < 0.55)")
    print("[PASS] FAISS Vector Search & Cosine Thresholding test PASSED!")

if __name__ == "__main__":
    test_faiss_vector_search()
