from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from datetime import datetime, timezone
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'owner'
    city = Column(String, nullable=False)

class RentalShop(Base):
    __tablename__ = "rental_shops"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, index=True, nullable=False)
    address = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    phone = Column(String, nullable=False)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, index=True, nullable=False)      # '2w' or '4w'
    subcategory = Column(String, index=True, nullable=False)   # 'Scooty', 'Gear Bike', '4 Seater', '6/7 Seater'
    city = Column(String, index=True, nullable=False)
    shop_id = Column(String, ForeignKey("rental_shops.id"), nullable=False)
    shop_name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    specs = Column(String, nullable=False)
    image = Column(String, nullable=False)
    available = Column(Boolean, default=True)

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    vehicle_name = Column(String, nullable=False)
    vehicle_image = Column(String, nullable=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, index=True, nullable=False)
    customer_phone = Column(String, nullable=False)
    dl_number = Column(String, nullable=False)
    aadhar_number = Column(String, nullable=False)
    city_name = Column(String, index=True, nullable=False)
    shop_id = Column(String, nullable=False)
    shop_name = Column(String, nullable=False)
    price_per_day = Column(Integer, nullable=False)
    booking_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String, default="Pending Pickup") # 'Pending Pickup', 'Completed', 'Cancelled (No-Show)'
