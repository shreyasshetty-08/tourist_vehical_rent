from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class LoginSchema(BaseModel):
    email: str
    password: str
    role: str = Field(..., description="'user' or 'owner'")
    city: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    city: str

class VehicleCreate(BaseModel):
    name: str
    category: str      # '2w' or '4w'
    subcategory: str   # 'Scooty', 'Gear Bike', '4 Seater', '6/7 Seater'
    city: str
    shop_id: str
    price: int
    specs: str
    image: Optional[str] = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600"

class VehiclePriceUpdate(BaseModel):
    price: int

class VehicleResponse(BaseModel):
    id: str
    name: str
    category: str
    subcategory: str
    city: str
    shop_id: str
    shop_name: str
    price: int
    specs: str
    image: str
    available: bool

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    vehicle_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    dl_number: str
    aadhar_number: str
    shop_id: str

class BookingResponse(BaseModel):
    id: str
    vehicle_id: str
    vehicle_name: str
    vehicle_image: Optional[str]
    customer_name: str
    customer_email: str
    customer_phone: str
    dl_number: str
    aadhar_number: str
    city_name: str
    shop_id: str
    shop_name: str
    price_per_day: int
    booking_time: datetime
    status: str

    class Config:
        from_attributes = True

class ShopResponse(BaseModel):
    id: str
    name: str
    city: str
    address: str
    lat: float
    lng: float
    phone: str
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True
