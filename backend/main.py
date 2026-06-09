import os
import json
import shutil
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, Security, File, UploadFile, Request
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
from dotenv import load_dotenv

import models
import schemas
import auth
from database import engine, get_db

load_dotenv()

# Initialize Database tables
models.Base.metadata.create_all(bind=engine)

def seed_admin_user(db: Session):
    admin_email = "admin@sakthishop.com"
    exists = db.query(models.User).filter(models.User.email == admin_email).first()
    if not exists:
        admin_user = models.User(
            email=admin_email,
            full_name="Sakthi Administrator",
            hashed_password=auth.get_password_hash("SAKTHIVEL__@2005"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
    else:
        # Update admin password to the new password in case it has changed
        exists.hashed_password = auth.get_password_hash("SAKTHIVEL__@2005")
        db.commit()

def seed_banners(db: Session):
    banner_count = db.query(models.Banner).count()
    if banner_count > 0:
        return

    initial_banners = [
        {
            "title": "Big Billion Days",
            "subtitle": "Upto 80% Off on Electronics",
            "cta": "Shop Now",
            "bg": "linear-gradient(135deg, #2874f0 0%, #0a3d91 100%)",
            "accent": "#ffd32a",
            "emoji": "⚡",
            "duration": 5,
            "expiry_time": None
        },
        {
            "title": "Fashion Week Sale",
            "subtitle": "Top Brands, Unbeatable Prices",
            "cta": "Explore",
            "bg": "linear-gradient(135deg, #e91e8c 0%, #7b1fa2 100%)",
            "accent": "#fff",
            "emoji": "👗",
            "duration": 5,
            "expiry_time": None
        },
        {
            "title": "Home Makeover",
            "subtitle": "Transform Your Space Today",
            "cta": "Discover",
            "bg": "linear-gradient(135deg, #ff9f00 0%, #e65100 100%)",
            "accent": "#fff",
            "emoji": "🏠",
            "duration": 5,
            "expiry_time": None
        }
    ]

    for banner_data in initial_banners:
        db_banner = models.Banner(**banner_data)
        db.add(db_banner)
    db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed database with products, banners, and admin on startup if empty
    db = next(get_db())
    try:
        seed_initial_products(db)
        seed_admin_user(db)
        seed_banners(db)
        fix_existing_local_images(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="SakthiShop Backend API",
    description="FastAPI Backend for SakthiShop E-Commerce site with API Key security & CRUD operations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Image upload directories
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# API Key Authentication Setup
API_KEY_NAME = "X-API-Key"
API_KEY = os.getenv("API_KEY", "sakthi_secret_key_2026")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def verify_api_key(header_key: str = Security(api_key_header)):
    if header_key == API_KEY:
        return header_key
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid or missing API Key"
    )

def process_local_image_path(image_url: str, request: Request) -> str:
    if not image_url:
        return image_url
    # If it is a local file or directory that exists on the server machine
    if os.path.exists(image_url):
        base_url = str(request.base_url).rstrip("/")
        if os.path.isfile(image_url):
            file_extension = os.path.splitext(image_url)[1].lower()
            if not file_extension:
                file_extension = ".jpg"
            import uuid
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            dest_path = os.path.join(UPLOAD_DIR, unique_filename)
            try:
                shutil.copy2(image_url, dest_path)
                return f"{base_url}/uploads/{unique_filename}"
            except Exception as e:
                print(f"Error copying local image: {e}")
        elif os.path.isdir(image_url):
            for file_name in os.listdir(image_url):
                ext = os.path.splitext(file_name)[1].lower()
                if ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                    image_file_path = os.path.join(image_url, file_name)
                    import uuid
                    unique_filename = f"{uuid.uuid4()}{ext}"
                    dest_path = os.path.join(UPLOAD_DIR, unique_filename)
                    try:
                        shutil.copy2(image_file_path, dest_path)
                        return f"{base_url}/uploads/{unique_filename}"
                    except Exception as e:
                        print(f"Error copying directory image: {e}")
    return image_url

def fix_existing_local_images(db: Session):
    products = db.query(models.Product).all()
    # Default fallback to standard backend host for DB corrections on startup
    base_url = "http://localhost:8000"
    updated_any = False
    for product in products:
        image_url = product.image
        if image_url and os.path.exists(image_url):
            new_url = None
            if os.path.isfile(image_url):
                file_extension = os.path.splitext(image_url)[1].lower()
                if not file_extension:
                    file_extension = ".jpg"
                import uuid
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                dest_path = os.path.join(UPLOAD_DIR, unique_filename)
                try:
                    shutil.copy2(image_url, dest_path)
                    new_url = f"{base_url}/uploads/{unique_filename}"
                except Exception as e:
                    print(f"Error copying local image on startup: {e}")
            elif os.path.isdir(image_url):
                for file_name in os.listdir(image_url):
                    ext = os.path.splitext(file_name)[1].lower()
                    if ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                        image_file_path = os.path.join(image_url, file_name)
                        import uuid
                        unique_filename = f"{uuid.uuid4()}{ext}"
                        dest_path = os.path.join(UPLOAD_DIR, unique_filename)
                        try:
                            shutil.copy2(image_file_path, dest_path)
                            new_url = f"{base_url}/uploads/{unique_filename}"
                            break
                        except Exception as e:
                            print(f"Error copying directory image on startup: {e}")
            
            if new_url:
                product.image = new_url
                updated_any = True
                
    if updated_any:
        db.commit()

# Database Seeding helper
def seed_initial_products(db: Session):
    product_count = db.query(models.Product).count()
    if product_count > 0:
        return

    # Seed products data
    initial_products = [
        {
            "name": "Samsung Galaxy S24 Ultra",
            "category": "electronics",
            "price": 124999,
            "originalPrice": 134999,
            "rating": 4.5,
            "reviews": 2341,
            "image": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
            "badge": "Best Seller",
            "badgeColor": "#ff6161",
            "specs": ["12GB RAM", "256GB Storage", "5000mAh", "S-Pen"],
            "discount": 7,
            "inStock": True,
            "freeDelivery": True,
        },
        {
            "id": 2,
            "name": "Apple iPhone 15 Pro Max",
            "category": "electronics",
            "price": 159900,
            "originalPrice": 169900,
            "rating": 4.7,
            "reviews": 5812,
            "image": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80",
            "badge": "Top Rated",
            "badgeColor": "#2874f0",
            "specs": ["A17 Pro Chip", "256GB", "Titanium", "48MP Camera"],
            "discount": 6,
            "inStock": True,
            "freeDelivery": True,
        },
        {
            "id": 3,
            "name": "Sony WH-1000XM5 Headphones",
            "category": "electronics",
            "price": 24990,
            "originalPrice": 34990,
            "rating": 4.6,
            "reviews": 3102,
            "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
            "badge": "28% Off",
            "badgeColor": "#388e3c",
            "specs": ["ANC", "30hr Battery", "Multipoint", "LDAC"],
            "discount": 28,
            "inStock": True,
            "freeDelivery": True,
        },
        {
            "id": 4,
            "name": "Nike Air Max 270",
            "category": "fashion",
            "price": 10995,
            "originalPrice": 13995,
            "rating": 4.3,
            "reviews": 891,
            "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
            "badge": "Trending",
            "badgeColor": "#ff9f00",
            "specs": ["Air Max Unit", "Lightweight", "Breathable", "Multiple Sizes"],
            "discount": 21,
            "inStock": True,
            "freeDelivery": False,
        },
        {
            "id": 5,
            "name": "Instant Pot Duo 7-in-1",
            "category": "home",
            "price": 8999,
            "originalPrice": 12999,
            "rating": 4.4,
            "reviews": 4201,
            "image": "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80",
            "badge": "Hot Deal",
            "badgeColor": "#ff6161",
            "specs": ["7-in-1", "6L Capacity", "Smart Programs", "Dishwasher Safe"],
            "discount": 31,
            "inStock": True,
            "freeDelivery": True,
        },
        {
            "id": 6,
            "name": "L'Oréal Paris Revitalift Serum",
            "category": "beauty",
            "price": 1299,
            "originalPrice": 1799,
            "rating": 4.2,
            "reviews": 2156,
            "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80",
            "badge": "Bestseller",
            "badgeColor": "#e91e8c",
            "specs": ["Vitamin C", "Anti-Aging", "30ml", "Derma Tested"],
            "discount": 28,
            "inStock": True,
            "freeDelivery": False,
        },
        {
            "id": 7,
            "name": "Adidas Ultraboost 23",
            "category": "sports",
            "price": 15999,
            "originalPrice": 19999,
            "rating": 4.5,
            "reviews": 1204,
            "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80",
            "badge": "20% Off",
            "badgeColor": "#388e3c",
            "specs": ["Boost Cushion", "Primeknit", "Continental Rubber", "Unisex"],
            "discount": 20,
            "inStock": True,
            "freeDelivery": True,
        },
        {
            "id": 8,
            "name": "Atomic Habits by James Clear",
            "category": "books",
            "price": 399,
            "originalPrice": 799,
            "rating": 4.8,
            "reviews": 12400,
            "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
            "badge": "50% Off",
            "badgeColor": "#ff6161",
            "specs": ["Paperback", "320 Pages", "English", "Self-Help"],
            "discount": 50,
            "inStock": True,
            "freeDelivery": False,
        },
        {
            "id": 9,
            "name": "MacBook Air M3",
            "category": "electronics",
            "price": 114900,
            "originalPrice": 124900,
            "rating": 4.8,
            "reviews": 3876,
            "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80",
            "badge": "Premium",
            "badgeColor": "#2874f0",
            "specs": ["M3 Chip", "8GB RAM", "256GB SSD", "18hr Battery"],
            "discount": 8,
            "inStock": True,
            "freeDelivery": True,
        },
        {
            "id": 10,
            "name": "Levi's 511 Slim Jeans",
            "category": "fashion",
            "price": 2999,
            "originalPrice": 4499,
            "rating": 4.1,
            "reviews": 3341,
            "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80",
            "badge": "Classic",
            "badgeColor": "#607d8b",
            "specs": ["Slim Fit", "100% Cotton", "Multiple Washes", "Stretchable"],
            "discount": 33,
            "inStock": True,
            "freeDelivery": False,
        },
        {
            "id": 11,
            "name": "Dyson V15 Detect Vacuum",
            "category": "home",
            "price": 52900,
            "originalPrice": 59900,
            "rating": 4.6,
            "reviews": 987,
            "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
            "badge": "Premium",
            "badgeColor": "#9c27b0",
            "specs": ["Laser Detect", "60min Battery", "HEPA Filter", "LCD Screen"],
            "discount": 12,
            "inStock": True,
            "freeDelivery": True,
        },
        {
            "id": 12,
            "name": "Yoga Mat Premium 6mm",
            "category": "sports",
            "price": 1499,
            "originalPrice": 2499,
            "rating": 4.3,
            "reviews": 5621,
            "image": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&q=80",
            "badge": "40% Off",
            "badgeColor": "#388e3c",
            "specs": ["6mm Thick", "Non-Slip", "Eco-Friendly", "With Carry Strap"],
            "discount": 40,
            "inStock": True,
            "freeDelivery": False,
        }
    ]

    for prod_data in initial_products:
        specs = prod_data.pop("specs", [])
        db_prod = models.Product(**prod_data)
        db_prod.specs = specs
        db.add(db_prod)
    db.commit()

# --- PUBLIC ENDPOINTS ---

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "SakthiShop API is running smoothly"}

@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_products(
    q: Optional[str] = None,
    cat: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)
    if cat and cat != "all":
        query = query.filter(models.Product.category == cat)
    if q:
        query = query.filter(models.Product.name.ilike(f"%{q}%"))
    
    products_list = query.all()
    # Map model attribute to schemas structure
    response_data = []
    for p in products_list:
        data = schemas.ProductResponse.model_validate(p)
        data.specs = p.specs
        response_data.append(data)
    return response_data

@app.get("/api/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    resp = schemas.ProductResponse.model_validate(product)
    resp.specs = product.specs
    return resp


# --- SECURE OPERATIONS (Requires X-API-Key header) ---

@app.post("/api/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    request: Request,
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    _key: str = Depends(verify_api_key)
):
    specs = product_in.specs
    product_data = product_in.model_dump(exclude={"specs"})
    product_data["image"] = process_local_image_path(product_data["image"], request)
    
    new_product = models.Product(**product_data)
    new_product.specs = specs
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    resp = schemas.ProductResponse.model_validate(new_product)
    resp.specs = new_product.specs
    return resp

@app.put("/api/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    request: Request,
    product_id: int,
    product_in: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    _key: str = Depends(verify_api_key)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    update_data = product_in.model_dump(exclude_unset=True)
    
    if "specs" in update_data:
        product.specs = update_data.pop("specs")
        
    if "image" in update_data and update_data["image"] is not None:
        update_data["image"] = process_local_image_path(update_data["image"], request)
        
    for key, value in update_data.items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    
    resp = schemas.ProductResponse.model_validate(product)
    resp.specs = product.specs
    return resp

@app.delete("/api/products/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _key: str = Depends(verify_api_key)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    db.delete(product)
    db.commit()
    return {"message": f"Product with id {product_id} deleted successfully"}

@app.post("/api/products/upload-image")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    _key: str = Depends(verify_api_key)
):
    # Deduce extension from filename or fall back to content_type
    file_extension = os.path.splitext(file.filename)[1].lower()
    if not file_extension:
        content_type = file.content_type or ""
        if "jpeg" in content_type or "jpg" in content_type:
            file_extension = ".jpg"
        elif "png" in content_type:
            file_extension = ".png"
        elif "gif" in content_type:
            file_extension = ".gif"
        elif "webp" in content_type:
            file_extension = ".webp"
        else:
            file_extension = ".jpg" # Default fallback

    # Save the file locally into /uploads
    import uuid
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Dynamically build the absolute URL using the requesting client's host/port
    base_url = str(request.base_url).rstrip("/")
    return {"image_url": f"{base_url}/uploads/{unique_filename}"}


@app.post("/api/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user)
):
    items_list = [item.model_dump() for item in order_in.items]
    items_str = json.dumps(items_list)

    user_id = order_in.user_id
    if current_user:
        user_id = current_user.id

    new_order = models.Order(
        user_id=user_id,
        customer_name=order_in.customer_name,
        phone=order_in.phone,
        address=order_in.address,
        city=order_in.city,
        pin=order_in.pin,
        payment_method=order_in.payment_method,
        items_json=items_str,
        total_amount=order_in.total_amount,
        status="Pending"
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    resp = schemas.OrderResponse.model_validate(new_order)
    return resp


@app.get("/api/orders", response_model=List[schemas.OrderResponse])
def get_orders(
    request: Request,
    db: Session = Depends(get_db)
):
    # Verify API key for old admin portal key support
    api_key_header_val = request.headers.get("X-API-Key")
    if api_key_header_val == API_KEY:
        orders_list = db.query(models.Order).order_by(models.Order.id.desc()).all()
        return [schemas.OrderResponse.model_validate(o) for o in orders_list]

    # Verify JWT authentication
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = auth.jwt.decode(token, auth.JWT_SECRET, algorithms=[auth.JWT_ALGORITHM])
            email = payload.get("sub")
            if email:
                user = db.query(models.User).filter(models.User.email == email).first()
                if user:
                    if user.role == "admin":
                        orders_list = db.query(models.Order).order_by(models.Order.id.desc()).all()
                    else:
                        orders_list = db.query(models.Order).filter(models.Order.user_id == user.id).order_by(models.Order.id.desc()).all()
                    return [schemas.OrderResponse.model_validate(o) for o in orders_list]
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized access to orders. Missing or invalid authentication."
    )


@app.put("/api/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    status_in: schemas.OrderStatusUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    is_admin = False
    api_key_header_val = request.headers.get("X-API-Key")
    if api_key_header_val == API_KEY:
        is_admin = True
    else:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = auth.jwt.decode(token, auth.JWT_SECRET, algorithms=[auth.JWT_ALGORITHM])
                email = payload.get("sub")
                if email:
                    user = db.query(models.User).filter(models.User.email == email).first()
                    if user and user.role == "admin":
                        is_admin = True
            except Exception:
                pass

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin personnel can update order status."
        )

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found"
        )
    order.status = status_in.status
    db.commit()
    db.refresh(order)
    
    resp = schemas.OrderResponse.model_validate(order)
    return resp


# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/auth/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    exists = db.query(models.User).filter(models.User.email == user_in.email).first()
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    user_count = db.query(models.User).count()
    role = "admin" if user_count == 0 else "user"

    new_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=auth.get_password_hash(user_in.password),
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_data = {"sub": new_user.email, "role": new_user.role}
    access_token = auth.create_access_token(data=token_data)
    
    resp_user = schemas.UserResponse.model_validate(new_user)
    return {"access_token": access_token, "token_type": "bearer", "user": resp_user}


@app.post("/api/auth/login", response_model=schemas.Token)
def login(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_in.email).first()
    if not user or not auth.verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_data = {"sub": user.email, "role": user.role}
    access_token = auth.create_access_token(data=token_data)
    
    resp_user = schemas.UserResponse.model_validate(user)
    return {"access_token": access_token, "token_type": "bearer", "user": resp_user}


@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.put("/api/auth/profile", response_model=schemas.UserResponse)
def update_profile(
    profile_in: schemas.UserProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.email is not None:
        if profile_in.email != current_user.email:
            exists = db.query(models.User).filter(models.User.email == profile_in.email).first()
            if exists:
                raise HTTPException(status_code=400, detail="Email already in use")
            current_user.email = profile_in.email
    if profile_in.password is not None and profile_in.password != "":
        current_user.hashed_password = auth.get_password_hash(profile_in.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user


# --- FAVORITES ENDPOINTS ---

@app.get("/api/users/favorites", response_model=List[schemas.ProductResponse])
def get_favorites(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    fav_ids = current_user.favorites
    if not fav_ids:
        return []
    products = db.query(models.Product).filter(models.Product.id.in_(fav_ids)).all()
    response_data = []
    for p in products:
        data = schemas.ProductResponse.model_validate(p)
        data.specs = p.specs
        response_data.append(data)
    return response_data


@app.post("/api/users/favorites/{product_id}")
def toggle_favorite(
    product_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    fav_ids = current_user.favorites
    if product_id in fav_ids:
        fav_ids.remove(product_id)
        message = "Removed from favorites"
    else:
        fav_ids.append(product_id)
        message = "Added to favorites"
        
    current_user.favorites = fav_ids
    db.commit()
    db.refresh(current_user)
    return {"message": message, "favorites": current_user.favorites}


# --- ADMIN CONTROL ENDPOINTS ---

@app.get("/api/admin/users", response_model=List[schemas.UserResponse])
def admin_get_users(
    _admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(models.User).all()


@app.put("/api/admin/users/{user_id}/role", response_model=schemas.UserResponse)
def admin_update_user_role(
    user_id: int,
    role_in: schemas.OrderStatusUpdate,
    _admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role_in.status not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role value")
        
    user.role = role_in.status
    db.commit()
    db.refresh(user)
    return user


@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(
    user_id: int,
    _admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == _admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")
        
    db.delete(user)
    db.commit()
    return {"message": f"User {user.email} deleted successfully"}


@app.get("/api/admin/dashboard-stats")
def admin_get_stats(
    _admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    total_revenue_list = db.query(models.Order).filter(models.Order.status != "Cancelled").all()
    revenue_sum = sum(o.total_amount for o in total_revenue_list) if total_revenue_list else 0.0

    total_orders = db.query(models.Order).count()
    total_products = db.query(models.Product).count()
    total_users = db.query(models.User).count()

    # Status breakdown
    orders = db.query(models.Order).all()
    status_counts = {}
    for o in orders:
        status_counts[o.status] = status_counts.get(o.status, 0) + 1

    # Category breakdown
    products = db.query(models.Product).all()
    category_counts = {}
    for p in products:
        category_counts[p.category] = category_counts.get(p.category, 0) + 1

    return {
        "total_revenue": revenue_sum,
        "total_orders": total_orders,
        "total_products": total_products,
        "total_users": total_users,
        "status_counts": status_counts,
        "category_counts": category_counts
    }


# --- BANNER ENDPOINTS ---

@app.get("/api/banners", response_model=List[schemas.BannerResponse])
def get_banners(db: Session = Depends(get_db)):
    return db.query(models.Banner).all()

@app.post("/api/banners", response_model=schemas.BannerResponse, status_code=status.HTTP_201_CREATED)
def create_banner(
    banner_in: schemas.BannerCreate,
    _admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    new_banner = models.Banner(**banner_in.model_dump())
    db.add(new_banner)
    db.commit()
    db.refresh(new_banner)
    return new_banner

@app.put("/api/banners/{banner_id}", response_model=schemas.BannerResponse)
def update_banner(
    banner_id: int,
    banner_in: schemas.BannerUpdate,
    _admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    update_data = banner_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(banner, key, value)
        
    db.commit()
    db.refresh(banner)
    return banner

@app.delete("/api/banners/{banner_id}")
def delete_banner(
    banner_id: int,
    _admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db)
):
    banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
        
    db.delete(banner)
    db.commit()
    return {"message": f"Banner {banner_id} deleted successfully"}


