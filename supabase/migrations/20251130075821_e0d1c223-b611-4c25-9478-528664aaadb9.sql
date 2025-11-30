-- Insert 99 demo products for Ramesh Kirana store
-- Store ID: 2f862420-5e6c-48c6-afbc-f5d6f67f2bbb

-- Insert products
INSERT INTO products (name, category, barcode, description, image_url) VALUES
-- Staples & Grains (10 products)
('Basmati Rice 5kg', 'Staples', '8901234567801', 'Premium quality basmati rice', NULL),
('Toor Dal 1kg', 'Staples', '8901234567802', 'Yellow split pigeon peas', NULL),
('Wheat Flour 10kg', 'Staples', '8901234567803', 'Whole wheat atta', NULL),
('Sugar 1kg', 'Staples', '8901234567804', 'White refined sugar', NULL),
('Moong Dal 500g', 'Staples', '8901234567805', 'Split green gram', NULL),
('Chana Dal 1kg', 'Staples', '8901234567806', 'Split chickpeas', NULL),
('Urad Dal 500g', 'Staples', '8901234567807', 'Black gram split', NULL),
('Masoor Dal 1kg', 'Staples', '8901234567808', 'Red lentils', NULL),
('Sona Masoori Rice 5kg', 'Staples', '8901234567809', 'Premium rice variety', NULL),
('Besan 1kg', 'Staples', '8901234567810', 'Gram flour', NULL),

-- Cooking Oils (8 products)
('Sunflower Oil 1L', 'Oils', '8901234567811', 'Refined sunflower oil', NULL),
('Mustard Oil 1L', 'Oils', '8901234567812', 'Pure mustard oil', NULL),
('Groundnut Oil 1L', 'Oils', '8901234567813', 'Cold pressed groundnut oil', NULL),
('Olive Oil 500ml', 'Oils', '8901234567814', 'Extra virgin olive oil', NULL),
('Coconut Oil 500ml', 'Oils', '8901234567815', 'Pure coconut oil', NULL),
('Ghee 500ml', 'Oils', '8901234567816', 'Pure cow ghee', NULL),
('Rice Bran Oil 1L', 'Oils', '8901234567817', 'Healthy cooking oil', NULL),
('Sesame Oil 500ml', 'Oils', '8901234567818', 'Cold pressed til oil', NULL),

-- Spices & Condiments (12 products)
('Turmeric Powder 200g', 'Spices', '8901234567819', 'Pure haldi powder', NULL),
('Red Chili Powder 200g', 'Spices', '8901234567820', 'Hot chili powder', NULL),
('Coriander Powder 200g', 'Spices', '8901234567821', 'Ground coriander', NULL),
('Garam Masala 100g', 'Spices', '8901234567822', 'Aromatic spice blend', NULL),
('Cumin Seeds 100g', 'Spices', '8901234567823', 'Whole jeera', NULL),
('Black Pepper 100g', 'Spices', '8901234567824', 'Whole peppercorns', NULL),
('Mustard Seeds 100g', 'Spices', '8901234567825', 'Black mustard seeds', NULL),
('Salt 1kg', 'Spices', '8901234567826', 'Iodized table salt', NULL),
('Tomato Ketchup 500g', 'Condiments', '8901234567827', 'Tangy tomato sauce', NULL),
('Soy Sauce 200ml', 'Condiments', '8901234567828', 'Dark soy sauce', NULL),
('Pickle Mixed 500g', 'Condiments', '8901234567829', 'Indian mixed pickle', NULL),
('Chili Sauce 200g', 'Condiments', '8901234567830', 'Hot chili sauce', NULL),

-- Snacks & Namkeen (10 products)
('Potato Chips 100g', 'Snacks', '8901234567831', 'Crispy potato chips', NULL),
('Kurkure 90g', 'Snacks', '8901234567832', 'Crunchy corn puffs', NULL),
('Bhujia 400g', 'Snacks', '8901234567833', 'Traditional namkeen', NULL),
('Mixture 400g', 'Snacks', '8901234567834', 'Spicy mixed snack', NULL),
('Sev 250g', 'Snacks', '8901234567835', 'Crispy sev', NULL),
('Peanuts Roasted 250g', 'Snacks', '8901234567836', 'Salted peanuts', NULL),
('Cashew Nuts 100g', 'Snacks', '8901234567837', 'Premium cashews', NULL),
('Almonds 100g', 'Snacks', '8901234567838', 'California almonds', NULL),
('Raisins 250g', 'Snacks', '8901234567839', 'Dried grapes', NULL),
('Popcorn 100g', 'Snacks', '8901234567840', 'Ready to cook popcorn', NULL),

-- Beverages (10 products)
('Tea Powder 500g', 'Beverages', '8901234567841', 'Premium tea leaves', NULL),
('Coffee Powder 200g', 'Beverages', '8901234567842', 'Filter coffee powder', NULL),
('Instant Coffee 50g', 'Beverages', '8901234567843', 'Instant coffee granules', NULL),
('Green Tea 25 Bags', 'Beverages', '8901234567844', 'Herbal green tea', NULL),
('Bournvita 500g', 'Beverages', '8901234567845', 'Health drink', NULL),
('Horlicks 500g', 'Beverages', '8901234567846', 'Nutrition drink', NULL),
('Tang 750g', 'Beverages', '8901234567847', 'Orange flavored drink', NULL),
('Coca Cola 1L', 'Beverages', '8901234567848', 'Carbonated soft drink', NULL),
('Pepsi 1L', 'Beverages', '8901234567849', 'Cola drink', NULL),
('Mineral Water 1L', 'Beverages', '8901234567850', 'Packaged drinking water', NULL),

-- Dairy Products (8 products)
('Milk Full Cream 1L', 'Dairy', '8901234567851', 'Fresh full cream milk', NULL),
('Curd 400g', 'Dairy', '8901234567852', 'Fresh yogurt', NULL),
('Paneer 200g', 'Dairy', '8901234567853', 'Fresh cottage cheese', NULL),
('Butter 100g', 'Dairy', '8901234567854', 'Salted butter', NULL),
('Cheese Slice 200g', 'Dairy', '8901234567855', 'Processed cheese', NULL),
('Buttermilk 500ml', 'Dairy', '8901234567856', 'Flavored buttermilk', NULL),
('Ice Cream 500ml', 'Dairy', '8901234567857', 'Vanilla ice cream', NULL),
('Lassi 200ml', 'Dairy', '8901234567858', 'Sweet lassi', NULL),

-- Personal Care (10 products)
('Soap 125g', 'Personal Care', '8901234567859', 'Bathing soap', NULL),
('Shampoo 200ml', 'Personal Care', '8901234567860', 'Hair shampoo', NULL),
('Toothpaste 150g', 'Personal Care', '8901234567861', 'Dental care', NULL),
('Toothbrush', 'Personal Care', '8901234567862', 'Medium bristles', NULL),
('Face Wash 100g', 'Personal Care', '8901234567863', 'Gentle face wash', NULL),
('Hand Wash 200ml', 'Personal Care', '8901234567864', 'Liquid hand wash', NULL),
('Hair Oil 200ml', 'Personal Care', '8901234567865', 'Coconut hair oil', NULL),
('Body Lotion 200ml', 'Personal Care', '8901234567866', 'Moisturizing lotion', NULL),
('Dettol Soap 125g', 'Personal Care', '8901234567867', 'Antiseptic soap', NULL),
('Talcum Powder 200g', 'Personal Care', '8901234567868', 'Body powder', NULL),

-- Household Items (10 products)
('Detergent 1kg', 'Household', '8901234567869', 'Washing powder', NULL),
('Dish Wash 500ml', 'Household', '8901234567870', 'Liquid dish cleaner', NULL),
('Floor Cleaner 1L', 'Household', '8901234567871', 'Surface cleaner', NULL),
('Toilet Cleaner 500ml', 'Household', '8901234567872', 'Bathroom cleaner', NULL),
('Tissue Paper Roll', 'Household', '8901234567873', 'Soft tissue roll', NULL),
('Garbage Bags 30pcs', 'Household', '8901234567874', 'Black garbage bags', NULL),
('Scrub Pad 5pcs', 'Household', '8901234567875', 'Cleaning scrubbers', NULL),
('Broom', 'Household', '8901234567876', 'Floor cleaning broom', NULL),
('Mosquito Coil 10pcs', 'Household', '8901234567877', 'Mosquito repellent', NULL),
('Matchbox 10pcs', 'Household', '8901234567878', 'Safety matches', NULL),

-- Biscuits & Confectionery (11 products)
('Parle G 200g', 'Biscuits', '8901234567879', 'Glucose biscuits', NULL),
('Marie Biscuits 200g', 'Biscuits', '8901234567880', 'Light sweet biscuits', NULL),
('Good Day 200g', 'Biscuits', '8901234567881', 'Butter cookies', NULL),
('Oreo 120g', 'Biscuits', '8901234567882', 'Chocolate cream biscuits', NULL),
('Monaco 200g', 'Biscuits', '8901234567883', 'Salty crackers', NULL),
('Dairy Milk 52g', 'Confectionery', '8901234567884', 'Milk chocolate', NULL),
('KitKat 37g', 'Confectionery', '8901234567885', 'Chocolate wafer', NULL),
('Munch 42g', 'Confectionery', '8901234567886', 'Crunchy chocolate', NULL),
('Eclairs 100g', 'Confectionery', '8901234567887', 'Toffee candy', NULL),
('Mentos 100g', 'Confectionery', '8901234567888', 'Chewy mints', NULL),
('Lollipop 10pcs', 'Confectionery', '8901234567889', 'Assorted lollipops', NULL),

-- Instant & Ready-to-Eat (10 products)
('Maggi 280g', 'Instant Food', '8901234567890', '4-pack instant noodles', NULL),
('Top Ramen 280g', 'Instant Food', '8901234567891', 'Curry flavor noodles', NULL),
('Yippee 280g', 'Instant Food', '8901234567892', 'Instant noodles', NULL),
('Pasta 500g', 'Instant Food', '8901234567893', 'Durum wheat pasta', NULL),
('Corn Flakes 500g', 'Instant Food', '8901234567894', 'Breakfast cereal', NULL),
('Oats 1kg', 'Instant Food', '8901234567895', 'Rolled oats', NULL),
('Bread 400g', 'Bakery', '8901234567896', 'White bread loaf', NULL),
('Pav Buns 6pcs', 'Bakery', '8901234567897', 'Soft buns', NULL),
('Rusk 300g', 'Bakery', '8901234567898', 'Tea time rusk', NULL),
('Cake Chocolate 200g', 'Bakery', '8901234567899', 'Chocolate sponge cake', NULL);

-- Insert inventory for all products
INSERT INTO inventory (product_id, store_id, quantity, price, low_stock_threshold)
SELECT 
  p.id,
  '2f862420-5e6c-48c6-afbc-f5d6f67f2bbb'::uuid,
  CASE 
    WHEN p.category = 'Staples' THEN (FLOOR(RANDOM() * 100) + 50)::int
    WHEN p.category = 'Oils' THEN (FLOOR(RANDOM() * 40) + 20)::int
    WHEN p.category = 'Spices' THEN (FLOOR(RANDOM() * 80) + 30)::int
    WHEN p.category = 'Condiments' THEN (FLOOR(RANDOM() * 50) + 25)::int
    WHEN p.category = 'Snacks' THEN (FLOOR(RANDOM() * 70) + 30)::int
    WHEN p.category = 'Beverages' THEN (FLOOR(RANDOM() * 60) + 25)::int
    WHEN p.category = 'Dairy' THEN (FLOOR(RANDOM() * 30) + 10)::int
    WHEN p.category = 'Personal Care' THEN (FLOOR(RANDOM() * 50) + 20)::int
    WHEN p.category = 'Household' THEN (FLOOR(RANDOM() * 40) + 15)::int
    WHEN p.category = 'Biscuits' THEN (FLOOR(RANDOM() * 80) + 40)::int
    WHEN p.category = 'Confectionery' THEN (FLOOR(RANDOM() * 100) + 50)::int
    WHEN p.category = 'Instant Food' THEN (FLOOR(RANDOM() * 60) + 30)::int
    WHEN p.category = 'Bakery' THEN (FLOOR(RANDOM() * 30) + 10)::int
    ELSE (FLOOR(RANDOM() * 50) + 20)::int
  END,
  CASE 
    WHEN p.category = 'Staples' THEN (FLOOR(RANDOM() * 300) + 100)::numeric
    WHEN p.category = 'Oils' THEN (FLOOR(RANDOM() * 200) + 120)::numeric
    WHEN p.category = 'Spices' THEN (FLOOR(RANDOM() * 100) + 30)::numeric
    WHEN p.category = 'Condiments' THEN (FLOOR(RANDOM() * 80) + 40)::numeric
    WHEN p.category = 'Snacks' THEN (FLOOR(RANDOM() * 60) + 20)::numeric
    WHEN p.category = 'Beverages' THEN (FLOOR(RANDOM() * 150) + 50)::numeric
    WHEN p.category = 'Dairy' THEN (FLOOR(RANDOM() * 100) + 30)::numeric
    WHEN p.category = 'Personal Care' THEN (FLOOR(RANDOM() * 120) + 40)::numeric
    WHEN p.category = 'Household' THEN (FLOOR(RANDOM() * 150) + 60)::numeric
    WHEN p.category = 'Biscuits' THEN (FLOOR(RANDOM() * 50) + 20)::numeric
    WHEN p.category = 'Confectionery' THEN (FLOOR(RANDOM() * 40) + 10)::numeric
    WHEN p.category = 'Instant Food' THEN (FLOOR(RANDOM() * 80) + 30)::numeric
    WHEN p.category = 'Bakery' THEN (FLOOR(RANDOM() * 50) + 20)::numeric
    ELSE (FLOOR(RANDOM() * 100) + 30)::numeric
  END,
  CASE 
    WHEN p.category IN ('Dairy', 'Bakery') THEN 5
    WHEN p.category IN ('Staples', 'Oils') THEN 10
    ELSE 8
  END
FROM products p
WHERE p.barcode IN (
  '8901234567801', '8901234567802', '8901234567803', '8901234567804', '8901234567805',
  '8901234567806', '8901234567807', '8901234567808', '8901234567809', '8901234567810',
  '8901234567811', '8901234567812', '8901234567813', '8901234567814', '8901234567815',
  '8901234567816', '8901234567817', '8901234567818', '8901234567819', '8901234567820',
  '8901234567821', '8901234567822', '8901234567823', '8901234567824', '8901234567825',
  '8901234567826', '8901234567827', '8901234567828', '8901234567829', '8901234567830',
  '8901234567831', '8901234567832', '8901234567833', '8901234567834', '8901234567835',
  '8901234567836', '8901234567837', '8901234567838', '8901234567839', '8901234567840',
  '8901234567841', '8901234567842', '8901234567843', '8901234567844', '8901234567845',
  '8901234567846', '8901234567847', '8901234567848', '8901234567849', '8901234567850',
  '8901234567851', '8901234567852', '8901234567853', '8901234567854', '8901234567855',
  '8901234567856', '8901234567857', '8901234567858', '8901234567859', '8901234567860',
  '8901234567861', '8901234567862', '8901234567863', '8901234567864', '8901234567865',
  '8901234567866', '8901234567867', '8901234567868', '8901234567869', '8901234567870',
  '8901234567871', '8901234567872', '8901234567873', '8901234567874', '8901234567875',
  '8901234567876', '8901234567877', '8901234567878', '8901234567879', '8901234567880',
  '8901234567881', '8901234567882', '8901234567883', '8901234567884', '8901234567885',
  '8901234567886', '8901234567887', '8901234567888', '8901234567889', '8901234567890',
  '8901234567891', '8901234567892', '8901234567893', '8901234567894', '8901234567895',
  '8901234567896', '8901234567897', '8901234567898', '8901234567899'
);