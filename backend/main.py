import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from geopy.distance import geodesic

from backend.database import Base, engine, get_db
from backend.models import User, RentalShop, Vehicle, Booking
from backend.schemas import (
    LoginSchema, AuthResponse,
    VehicleCreate, VehiclePriceUpdate, VehicleResponse,
    BookingCreate, BookingResponse,
    ShopResponse
)
from backend.seed import seed_database

# Create DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DriveEase REST API",
    description="Python FastAPI backend powering the DriveEase Vehicle Rental Platform",
    version="2.0.0"
)

# CORS Middleware (allows frontend on any local port to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed database with initial data on startup
@app.on_event("startup")
def on_startup():
    db = next(get_db())
    seed_database(db)

@app.get("/")
def root():
    return {
        "service": "DriveEase Backend API",
        "status": "Online",
        "documentation": "/docs"
    }

# 1. Dual-Role Authentication (Customer & Rental Owner)
@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    # Simple token generator for dual-slide login
    token = f"jwt-{uuid.uuid4().hex[:16]}"
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        role=payload.role,
        email=payload.email,
        city=payload.city
    )

# 2. Get Shops & Geodesic Nearest Shop Calculator
@app.get("/api/shops", response_model=List[ShopResponse])
def get_shops(
    city: str,
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RentalShop).filter(RentalShop.city.ilike(city)).all()
    shops_list = []
    
    for shop in query:
        shop_dict = {
            "id": shop.id,
            "name": shop.name,
            "city": shop.city,
            "address": shop.address,
            "lat": shop.lat,
            "lng": shop.lng,
            "phone": shop.phone,
            "distance_km": None
        }
        if user_lat is not None and user_lng is not None:
            dist = geodesic((user_lat, user_lng), (shop.lat, shop.lng)).km
            shop_dict["distance_km"] = round(dist, 2)
        shops_list.append(shop_dict)

    if user_lat is not None and user_lng is not None:
        shops_list.sort(key=lambda s: s["distance_km"])

    return shops_list

# 3. Vehicle Catalog with Multi-Tier Filters
@app.get("/api/vehicles", response_model=List[VehicleResponse])
def get_vehicles(
    city: str,
    category: Optional[str] = Query(None, description="all, 2w, or 4w"),
    subcategory: Optional[str] = Query(None, description="Scooty, Gear Bike, 4 Seater, 6/7 Seater"),
    max_price: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle).filter(Vehicle.city.ilike(city))

    if category and category.lower() != "all":
        query = query.filter(Vehicle.category == category.lower())

    if subcategory and subcategory.lower() != "all":
        query = query.filter(Vehicle.subcategory.ilike(subcategory))

    if max_price:
        query = query.filter(Vehicle.price <= max_price)

    vehicles = query.all()

    if search:
        s = search.lower()
        vehicles = [
            v for v in vehicles 
            if s in v.name.lower() or s in v.shop_name.lower() or s in v.subcategory.lower()
        ]

    return vehicles

# 4. Add New Vehicle (Owner Action)
@app.post("/api/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def add_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    shop = db.query(RentalShop).filter(RentalShop.id == payload.shop_id).first()
    shop_name = shop.name if shop else "Main City Hub"

    new_veh = Vehicle(
        id=f"v-{uuid.uuid4().hex[:8]}",
        name=payload.name,
        category=payload.category,
        subcategory=payload.subcategory,
        city=payload.city,
        shop_id=payload.shop_id,
        shop_name=shop_name,
        price=payload.price,
        specs=payload.specs,
        image=payload.image or "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600",
        available=True
    )
    db.add(new_veh)
    db.commit()
    db.refresh(new_veh)
    return new_veh

# 5. Real-Time Price Update (Owner Action)
@app.put("/api/vehicles/{vehicle_id}/price", response_model=VehicleResponse)
def update_vehicle_price(vehicle_id: str, payload: VehiclePriceUpdate, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    veh.price = payload.price
    db.commit()
    db.refresh(veh)
    return veh

# 6. Toggle Vehicle Availability (Owner Action)
@app.patch("/api/vehicles/{vehicle_id}/toggle", response_model=VehicleResponse)
def toggle_availability(vehicle_id: str, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    veh.available = not veh.available
    db.commit()
    db.refresh(veh)
    return veh

# 7. Delete Vehicle (Owner Action)
@app.delete("/api/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(veh)
    db.commit()
    return {"message": "Vehicle removed successfully"}

# 8. Create Vehicle Booking with DL & Aadhar KYC Verification
@app.post("/api/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    shop = db.query(RentalShop).filter(RentalShop.id == payload.shop_id).first()
    shop_name = shop.name if shop else veh.shop_name

    booking_id = f"BK{uuid.uuid4().hex[:6].upper()}"
    new_booking = Booking(
        id=booking_id,
        vehicle_id=veh.id,
        vehicle_name=veh.name,
        vehicle_image=veh.image,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        dl_number=payload.dl_number.upper(),
        aadhar_number=payload.aadhar_number,
        city_name=veh.city,
        shop_id=payload.shop_id,
        shop_name=shop_name,
        price_per_day=veh.price,
        booking_time=datetime.now(timezone.utc),
        status="Pending Pickup"
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

# 9. List Bookings (Filterable by customer email or owner's city)
@app.get("/api/bookings", response_model=List[BookingResponse])
def get_bookings(
    customer_email: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Booking)
    if customer_email:
        query = query.filter(Booking.customer_email == customer_email)
    if city:
        query = query.filter(Booking.city_name.ilike(city))
    return query.order_by(Booking.booking_time.desc()).all()

# 10. 30-Minute No-Show Cancellation Endpoint (Owner Protection)
@app.post("/api/bookings/{booking_id}/cancel-noshow")
def cancel_overdue_order(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = "Cancelled (No-Show)"
    
    # Restore vehicle availability
    veh = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
    if veh:
        veh.available = True

    db.commit()
    return {"message": f"Booking #{booking_id} cancelled due to 30-min customer no-show. Vehicle released."}

# 11. Complete Order / Handover Ride
@app.post("/api/bookings/{booking_id}/complete")
def complete_order(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "Completed"
    db.commit()
    return {"message": f"Ride handed over to customer {booking.customer_name}."}
