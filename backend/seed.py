from backend.models import RentalShop, Vehicle
from sqlalchemy.orm import Session

INITIAL_SHOPS = [
    # Goa
    RentalShop(id="shop-goa-1", name="Baga Beach Rental Hub", city="Goa", address="Tito's Lane, Baga, Goa", lat=15.5553, lng=73.7517, phone="+91 98221 11223"),
    RentalShop(id="shop-goa-2", name="Panjim Central Mobility", city="Goa", address="Near MG Road, Panjim, Goa", lat=15.4989, lng=73.8278, phone="+91 98221 44556"),
    RentalShop(id="shop-goa-3", name="Calangute Scooters & Cars", city="Goa", address="Main Beach Road, Calangute, Goa", lat=15.5438, lng=73.7554, phone="+91 98221 77889"),
    # Delhi
    RentalShop(id="shop-delhi-1", name="Connaught Place Wheels", city="Delhi", address="Block B, CP, New Delhi", lat=28.6315, lng=77.2167, phone="+91 98110 12345"),
    RentalShop(id="shop-delhi-2", name="Karol Bagh Bike Hub", city="Delhi", address="Gurudwara Road, Karol Bagh, New Delhi", lat=28.6514, lng=77.1907, phone="+91 98110 54321"),
    # Mumbai
    RentalShop(id="shop-mum-1", name="Bandra Car & Bike Zone", city="Mumbai", address="Hill Road, Bandra West, Mumbai", lat=19.0596, lng=72.8295, phone="+91 98200 33445"),
    RentalShop(id="shop-mum-2", name="Marine Drive Mobility", city="Mumbai", address="Near Churchgate, Mumbai", lat=18.9438, lng=72.8233, phone="+91 98200 66778"),
    # Pondicherry
    RentalShop(id="shop-pon-1", name="French Quarter Rides", city="Pondicherry", address="White Town, Puducherry", lat=11.9338, lng=79.8335, phone="+91 94430 11223"),
    RentalShop(id="shop-pon-2", name="Rock Beach Bikes & Cars", city="Pondicherry", address="Goubert Avenue, Puducherry", lat=11.9352, lng=79.8360, phone="+91 94430 44556"),
    # Bengaluru
    RentalShop(id="shop-blr-1", name="Indiranagar Wheels", city="Bengaluru", address="100 Feet Road, Indiranagar, Bengaluru", lat=12.9784, lng=77.6408, phone="+91 98450 12345"),
    RentalShop(id="shop-blr-2", name="Koramangala Mobility", city="Bengaluru", address="80 Feet Road, Koramangala, Bengaluru", lat=12.9352, lng=77.6245, phone="+91 98450 67890"),
]

INITIAL_VEHICLES = [
    # Goa
    Vehicle(id="v-goa-1", name="Honda Activa 6G", category="2w", subcategory="Scooty", city="Goa", shop_id="shop-goa-1", shop_name="Baga Beach Rental Hub", price=400, specs="110cc | Automatic | Petrol", image="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80", available=True),
    Vehicle(id="v-goa-2", name="Royal Enfield Classic 350", category="2w", subcategory="Gear Bike", city="Goa", shop_id="shop-goa-3", shop_name="Calangute Scooters & Cars", price=900, specs="349cc | Manual | Petrol", image="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80", available=True),
    Vehicle(id="v-goa-3", name="Mahindra Thar 4x4", category="4w", subcategory="4 Seater", city="Goa", shop_id="shop-goa-1", shop_name="Baga Beach Rental Hub", price=3500, specs="4 Seater | Automatic | Diesel", image="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80", available=True),
    Vehicle(id="v-goa-4", name="Toyota Innova Crysta", category="4w", subcategory="6/7 Seater", city="Goa", shop_id="shop-goa-2", shop_name="Panjim Central Mobility", price=4200, specs="7 Seater | Manual | Diesel", image="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80", available=True),
    Vehicle(id="v-goa-5", name="Maruti Suzuki Swift", category="4w", subcategory="4 Seater", city="Goa", shop_id="shop-goa-3", shop_name="Calangute Scooters & Cars", price=1800, specs="5 Seater | Manual | Petrol", image="https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600&auto=format&fit=crop&q=80", available=True),
    # Delhi
    Vehicle(id="v-del-1", name="Yamaha FZ-S V3", category="2w", subcategory="Gear Bike", city="Delhi", shop_id="shop-delhi-2", shop_name="Karol Bagh Bike Hub", price=750, specs="149cc | Manual | Petrol", image="https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&auto=format&fit=crop&q=80", available=True),
    Vehicle(id="v-del-2", name="Suzuki Access 125", category="2w", subcategory="Scooty", city="Delhi", shop_id="shop-delhi-1", shop_name="Connaught Place Wheels", price=420, specs="124cc | Automatic | Petrol", image="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80", available=True),
    Vehicle(id="v-del-3", name="Hyundai Creta SX", category="4w", subcategory="4 Seater", city="Delhi", shop_id="shop-delhi-1", shop_name="Connaught Place Wheels", price=2500, specs="5 Seater | Automatic | Petrol", image="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&auto=format&fit=crop&q=80", available=True),
    # Mumbai
    Vehicle(id="v-mum-1", name="Vespa ZX 125", category="2w", subcategory="Scooty", city="Mumbai", shop_id="shop-mum-1", shop_name="Bandra Car & Bike Zone", price=500, specs="125cc | Automatic | Premium", image="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80", available=True),
    Vehicle(id="v-mum-2", name="KTM Duke 390", category="2w", subcategory="Gear Bike", city="Mumbai", shop_id="shop-mum-2", shop_name="Marine Drive Mobility", price=1400, specs="373cc | Manual | Petrol", image="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80", available=True),
    # Pondicherry
    Vehicle(id="v-pon-1", name="Aprilia SR 160", category="2w", subcategory="Scooty", city="Pondicherry", shop_id="shop-pon-1", shop_name="French Quarter Rides", price=450, specs="160cc | Automatic | Petrol", image="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80", available=True),
    Vehicle(id="v-pon-2", name="Royal Enfield Meteor 350", category="2w", subcategory="Gear Bike", city="Pondicherry", shop_id="shop-pon-2", shop_name="Rock Beach Bikes & Cars", price=950, specs="349cc | Manual | Petrol", image="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80", available=True),
    # Bengaluru
    Vehicle(id="v-blr-1", name="Ather 450X (Electric)", category="2w", subcategory="Scooty", city="Bengaluru", shop_id="shop-blr-1", shop_name="Indiranagar Wheels", price=550, specs="105 km Range | Electric Automatic", image="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80", available=True),
    Vehicle(id="v-blr-2", name="BMW G 310 GS", category="2w", subcategory="Gear Bike", city="Bengaluru", shop_id="shop-blr-2", shop_name="Koramangala Mobility", price=1600, specs="313cc Adventure | Manual | Petrol", image="https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&auto=format&fit=crop&q=80", available=True),
]

def seed_database(db: Session):
    if db.query(RentalShop).count() == 0:
        db.add_all(INITIAL_SHOPS)
        db.commit()
    if db.query(Vehicle).count() == 0:
        db.add_all(INITIAL_VEHICLES)
        db.commit()
