from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import json

class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    originalPrice: float
    rating: Optional[float] = 4.0
    reviews: Optional[int] = 0
    image: str
    badge: Optional[str] = None
    badgeColor: Optional[str] = None
    specs: List[str] = Field(default_factory=list)
    discount: Optional[int] = 0
    inStock: Optional[bool] = True
    freeDelivery: Optional[bool] = False

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    originalPrice: Optional[float] = None
    rating: Optional[float] = None
    reviews: Optional[int] = None
    image: Optional[str] = None
    badge: Optional[str] = None
    badgeColor: Optional[str] = None
    specs: Optional[List[str]] = None
    discount: Optional[int] = None
    inStock: Optional[bool] = None
    freeDelivery: Optional[bool] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    price: float
    originalPrice: float
    rating: float
    reviews: int
    image: str
    badge: Optional[str] = None
    badgeColor: Optional[str] = None
    specs: List[str] = []
    discount: int
    inStock: bool
    freeDelivery: bool

    model_config = {
        "from_attributes": True
    }

    # Custom validator to map SQLAlchemy specs_json to specs list
    @field_validator('specs', mode='before')
    @classmethod
    def parse_specs(cls, v):
        # SQLAlchemy object attribute is handled through property,
        # but if we read raw value, parse it
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v


class OrderItem(BaseModel):
    id: int
    name: str
    price: float
    qty: int

class OrderCreate(BaseModel):
    user_id: Optional[int] = None
    customer_name: str
    phone: str
    address: str
    city: str
    pin: str
    payment_method: str
    items: List[OrderItem]
    total_amount: float

class OrderResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    customer_name: str
    phone: str
    address: str
    city: str
    pin: str
    payment_method: str
    items: List[OrderItem] = []
    total_amount: float
    status: str

    model_config = {
        "from_attributes": True
    }

    @field_validator('items', mode='before')
    @classmethod
    def parse_items(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v


class OrderStatusUpdate(BaseModel):
    status: str


class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: str
    favorites: List[int] = []

    model_config = {
        "from_attributes": True
    }

    @field_validator('favorites', mode='before')
    @classmethod
    def parse_favorites(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class BannerBase(BaseModel):
    title: str
    subtitle: str
    cta: Optional[str] = "Shop Now"
    bg: Optional[str] = "linear-gradient(135deg, #2874f0 0%, #0a3d91 100%)"
    accent: Optional[str] = "#ffd32a"
    emoji: Optional[str] = "⚡"
    duration: Optional[int] = 5
    expiry_time: Optional[str] = None

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    cta: Optional[str] = None
    bg: Optional[str] = None
    accent: Optional[str] = None
    emoji: Optional[str] = None
    duration: Optional[int] = None
    expiry_time: Optional[str] = None

class BannerResponse(BannerBase):
    id: int

    model_config = {
        "from_attributes": True
    }

