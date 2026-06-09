import json
from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    originalPrice = Column(Float, nullable=False)
    rating = Column(Float, default=4.0)
    reviews = Column(Integer, default=0)
    image = Column(String, nullable=False)  # Can be a URL or a static path /uploads/filename
    badge = Column(String, nullable=True)
    badgeColor = Column(String, nullable=True)
    specs_json = Column(Text, default="[]")  # Stored as JSON string
    discount = Column(Integer, default=0)
    inStock = Column(Boolean, default=True)
    freeDelivery = Column(Boolean, default=False)

    @property
    def specs(self):
        try:
            return json.loads(self.specs_json)
        except Exception:
            return []

    @specs.setter
    def specs(self, value):
        self.specs_json = json.dumps(value)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="user")  # "user" or "admin"
    favorites_json = Column(Text, default="[]")  # JSON string list of product IDs

    @property
    def favorites(self):
        try:
            return json.loads(self.favorites_json)
        except Exception:
            return []

    @favorites.setter
    def favorites(self, value):
        self.favorites_json = json.dumps(value)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # Associated user ID (if logged in)
    customer_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    pin = Column(String, nullable=False)
    payment_method = Column(String, nullable=False)
    items_json = Column(Text, default="[]")  # JSON string representing list of purchased products
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="Pending")

    @property
    def items(self):
        try:
            return json.loads(self.items_json)
        except Exception:
            return []

    @items.setter
    def items(self, value):
        self.items_json = json.dumps(value)


class Banner(Base):
    __tablename__ = "banners"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subtitle = Column(String, nullable=False)
    cta = Column(String, default="Shop Now")
    bg = Column(String, default="linear-gradient(135deg, #2874f0 0%, #0a3d91 100%)")
    accent = Column(String, default="#ffd32a")
    emoji = Column(String, default="⚡")
    duration = Column(Integer, default=5)  # timing duration in seconds
    expiry_time = Column(String, nullable=True)  # countdown timestamp


