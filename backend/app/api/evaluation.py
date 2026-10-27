from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/evaluation", tags=["Evaluation & Benchmarks"])

@router.get("/ppt-benchmarks")
def get_ppt_benchmarks():
    return EvaluationService.get_ppt_benchmark_comparison()

@router.post("/run")
def run_evaluation(db: Session = Depends(get_db)):
    return EvaluationService.run_live_evaluation(db)
