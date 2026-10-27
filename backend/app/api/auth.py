from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    department: str
    institute: str
    role: str

class UpdateProfileRequest(BaseModel):
    name: str
    role: str
    email: str = "faculty@gniot.net.in"
    department: str = "Department of AI / AI&DS"
    institute: str = "Greater Noida Institute of Technology (GNIOT)"

class LoginResponse(BaseModel):
    token: str
    user: UserProfile

current_faculty_profile = UserProfile(
    id=1,
    name="Faculty Portal",
    email="faculty@gniot.net.in",
    department="Department of AI / AI&DS",
    institute="Greater Noida Institute of Technology (GNIOT)",
    role="Faculty In-Charge"
)

@router.post("/login", response_model=LoginResponse)
def login(creds: LoginRequest):
    # Professional prototype authentication
    if creds.email and creds.password:
        return LoginResponse(
            token="prototype-faculty-jwt-token-2026",
            user=current_faculty_profile
        )
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credentials")

@router.get("/profile", response_model=UserProfile)
def get_profile():
    return current_faculty_profile

@router.put("/profile", response_model=UserProfile)
def update_profile(req: UpdateProfileRequest):
    global current_faculty_profile
    current_faculty_profile = UserProfile(
        id=1,
        name=req.name.strip() or "Faculty Portal",
        email=req.email.strip() or "faculty@gniot.net.in",
        department=req.department.strip() or "Department of AI / AI&DS",
        institute=req.institute.strip() or "Greater Noida Institute of Technology (GNIOT)",
        role=req.role.strip() or "Faculty In-Charge"
    )
    return current_faculty_profile
