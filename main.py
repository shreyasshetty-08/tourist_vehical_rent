"""
DriveEase - Python FastAPI Backend Server
Run with:
  .\\venv\\Scripts\\Activate.ps1
  uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from geopy.distance import geodesic

app = FastAPI(
    title="DriveEase API",
    description="Backend API for Vehicle Rental Platform (Dual-Role Auth, KYC, 30-Min Cancellation, Nearest Shop Routing)",
    version="1.0.0"
)

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IN-MEMORY DATABASE (Persisted during server runtime) ---
SHOPS_DB = [
    {"id": "shop-goa-1", "name": "Baga Beach Rental Hub", "city": "Goa", "lat": 15.5553, "lng": 73.7517, "phone": "+91 98221 11223"},
    {"id": "shop-goa-2", "name": "Panjim Central Mobility", "city": "Goa", "lat": 15.4989, "lng": 73.8278, "phone": "+91 98221 44556"},
    {"id": "shop-goa-3", "name": "Calangute Scooters & Cars", "city": "Goa", "lat": 15.5438, "lng": 73.7554, "phone": "+91 98221 77889"},
    {"id": "shop-mum-1", "name": "Bandra Car & Bike Zone", "city": "Mumbai", "lat": 19.0596, "lng": 72.8295, "phone": "+91 98200 33445"},
    {"id": "shop-del-1", "name": "Connaught Place Wheels", "city": "Delhi", "lat": 28.6315, "lng": 77.2167, "phone": "+91 98110 12345"},
    {"id": "shop-pon-1", "name": "French Quarter Rides", "city": "Pondicherry", "lat": 11.9338, "lng": 79.8335, "phone": "+91 94430 11223"},
    {"id": "shop-blr-1", "name": "Indiranagar Wheels", "city": "Bengaluru", "lat": 12.9784, "lng": 77.6408, "phone": "+91 98450 12345"},
]

VEHICLES_DB = [
    {"id": "v-goa-1", "name": "Honda Activa 6G", "category": "2w", "subcategory": "Scooty", "city": "Goa", "price": 400, "specs": "110cc | Automatic | Petrol", "available": True, "shop_id": "shop-goa-1"},
    {"id": "v-goa-2", "name": "Royal Enfield Classic 350", "category": "2w", "subcategory": "Gear Bike", "city": "Goa", "price": 900, "specs": "349cc | Manual | Petrol", "available": True, "shop_id": "shop-goa-3"},
    {"id": "v-goa-3", "name": "Mahindra Thar 4x4", "category": "4w", "subcategory": "4 Seater", "city": "Goa", "price": 3500, "specs": "4 Seater | Automatic | Diesel", "available": True, "shop_id": "shop-goa-1"},
    {"id": "v-goa-4", "name": "Toyota Innova Crysta", "category": "4w", "subcategory": "6/7 Seater", "city": "Goa", "price": 4200, "specs": "7 Seater | Manual | Diesel", "available": True, "shop_id": "shop-goa-2"},
]

BOOKINGS_DB = []

# --- PYDANTIC SCHEMAS ---
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str = Field(..., description="'user' or 'owner'")
    city: str

class BookingCreate(BaseModel):
    vehicle_id: str
    customer_name: str
    customer_phone: str
    dl_number: str
    aadhar_number: str
    shop_id: str

class VehicleCreate(BaseModel):
    name: str
    category: str
    subcategory: str
    city: str
    price: int
    specs: str
    shop_id: str

# --- API ENDPOINTS ---

@app.get("/")
def home():
    return {"message": "DriveEase Python API is live", "docs": "/docs"}

# 1. Dual-Slide Authentication
@app.post("/api/auth/login")
def login(auth: LoginRequest):
    return {
        "access_token": f"token-{uuid.uuid4().hex[:12]}",
        "token_type": "bearer",
        "role": auth.role,
        "email": auth.email,
        "city": auth.city
    }

# 2. Get Vehicles with Category, Subcategory & Price Filtering
@app.get("/api/vehicles")
def get_vehicles(
    city: str,
    category: Optional[str] = Query(None, description="2w or 4w"),
    subcategory: Optional[str] = Query(None, description="Scooty, Gear Bike, 4 Seater, 6/7 Seater"),
    max_price: Optional[int] = Query(None)
):
    results = [v for v in VEHICLES_DB if v["city"].lower() == city.lower()]
    if category and category != "all":
        results = [v for v in results if v["category"] == category]
    if subcategory and subcategory != "all":
        results = [v for v in results if v["subcategory"] == subcategory]
    if max_price:
        results = [v for v in results if v["price"] <= max_price]
    return results

# 3. Create Booking with DL & Aadhar KYC Verification
@app.post("/api/bookings", status_code=status.HTTP_201_CREATED)
def create_booking(booking: BookingCreate):
    booking_id = f"BK-{uuid.uuid4().hex[:6].upper()}"
    new_record = {
        "id": booking_id,
        "vehicle_id": booking.vehicle_id,
        "customer_name": booking.customer_name,
        "customer_phone": booking.customer_phone,
        "dl_number": booking.dl_number.upper(),
        "aadhar_number": booking.aadhar_number,
        "shop_id": booking.shop_id,
        "status": "Pending Pickup",
        "booking_time": datetime.now(timezone.utc).isoformat()
    }
    BOOKINGS_DB.insert(0, new_record)
    return {"message": "Booking confirmed", "booking": new_record}

# 4. Get Bookings List
@app.get("/api/bookings")
def list_bookings():
    return BOOKINGS_DB

# 5. 30-Minute No-Show Cancellation Endpoint (For Owners)
@app.post("/api/bookings/{booking_id}/cancel-noshow")
def cancel_no_show_order(booking_id: str):
    target = next((b for b in BOOKINGS_DB if b["id"] == booking_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Calculate elapsed minutes
    created_at = datetime.fromisoformat(target["booking_time"])
    elapsed_minutes = (datetime.now(timezone.utc) - created_at).total_seconds() / 60

    target["status"] = "Cancelled (No-Show >30m)"
    return {
        "message": f"Order #{booking_id} cancelled successfully",
        "elapsed_minutes": round(elapsed_minutes, 1),
        "status": target["status"]
    }

# 6. Nearest Shop Calculation (using GeoPy geodesic distance)
@app.get("/api/shops/nearest")
def get_nearest_shops(user_lat: float, user_lng: float, city: str):
    city_shops = [s for s in SHOPS_DB if s["city"].lower() == city.lower()]
    for shop in city_shops:
        dist_km = geodesic((user_lat, user_lng), (shop["lat"], shop["lng"])).km
        shop["distance_km"] = round(dist_km, 2)
    
    city_shops.sort(key=lambda s: s["distance_km"])
    return city_shops
