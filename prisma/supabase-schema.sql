-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- This creates all the new tables and columns for the field service app

-- ============================================
-- NEW TABLES
-- ============================================

-- Equipment Checkout
CREATE TABLE IF NOT EXISTS "EquipmentCheckout" (
    "id" TEXT PRIMARY KEY,
    "equipmentId" TEXT NOT NULL REFERENCES "Equipment"("id") ON DELETE CASCADE,
    "workOrderId" TEXT NOT NULL REFERENCES "WorkOrder"("id") ON DELETE CASCADE,
    "checkedOutById" TEXT NOT NULL REFERENCES "User"("id"),
    "checkedOutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInAt" TIMESTAMP(3),
    "checkedInById" TEXT REFERENCES "User"("id"),
    "notes" TEXT
);

-- Job Photos
CREATE TABLE IF NOT EXISTS "JobPhoto" (
    "id" TEXT PRIMARY KEY,
    "workOrderId" TEXT NOT NULL REFERENCES "WorkOrder"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id"),
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "caption" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Job Checklist Items
CREATE TABLE IF NOT EXISTS "JobChecklistItem" (
    "id" TEXT PRIMARY KEY,
    "workOrderId" TEXT NOT NULL REFERENCES "WorkOrder"("id") ON DELETE CASCADE,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedById" TEXT REFERENCES "User"("id"),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles
CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "licensePlate" TEXT,
    "vin" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "crewId" TEXT UNIQUE REFERENCES "Crew"("id"),
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "lastLocationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Location Logs
CREATE TABLE IF NOT EXISTS "VehicleLocationLog" (
    "id" TEXT PRIMARY KEY,
    "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"("id") ON DELETE CASCADE,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Route Stops
CREATE TABLE IF NOT EXISTS "RouteStop" (
    "id" TEXT PRIMARY KEY,
    "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"("id") ON DELETE CASCADE,
    "workOrderId" TEXT NOT NULL UNIQUE REFERENCES "WorkOrder"("id") ON DELETE CASCADE,
    "order" INTEGER NOT NULL DEFAULT 0,
    "estimatedArrival" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Service Agreements
CREATE TABLE IF NOT EXISTS "ServiceAgreement" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
    "propertyId" TEXT REFERENCES "Property"("id"),
    "serviceTypeId" TEXT NOT NULL REFERENCES "ServiceType"("id"),
    "frequency" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "nextServiceDate" TIMESTAMP(3),
    "autoInvoice" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Quotes
CREATE TABLE IF NOT EXISTS "Quote" (
    "id" TEXT PRIMARY KEY,
    "quoteNumber" TEXT NOT NULL UNIQUE,
    "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
    "propertyId" TEXT REFERENCES "Property"("id"),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "validUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL REFERENCES "User"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Quote Items
CREATE TABLE IF NOT EXISTS "QuoteItem" (
    "id" TEXT PRIMARY KEY,
    "quoteId" TEXT NOT NULL REFERENCES "Quote"("id") ON DELETE CASCADE,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT
);

-- Job Forms
CREATE TABLE IF NOT EXISTS "JobForm" (
    "id" TEXT PRIMARY KEY,
    "workOrderId" TEXT NOT NULL REFERENCES "WorkOrder"("id") ON DELETE CASCADE,
    "formType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "submittedById" TEXT REFERENCES "User"("id"),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Items (upsells)
CREATE TABLE IF NOT EXISTS "WorkOrderItem" (
    "id" TEXT PRIMARY KEY,
    "workOrderId" TEXT NOT NULL REFERENCES "WorkOrder"("id") ON DELETE CASCADE,
    "serviceTypeId" TEXT NOT NULL REFERENCES "ServiceType"("id"),
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "addedById" TEXT NOT NULL REFERENCES "User"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- ALTER EXISTING TABLES (new columns)
-- ============================================

-- WorkOrder: add new columns
ALTER TABLE "WorkOrder" 
ADD COLUMN IF NOT EXISTS "quoteId" TEXT UNIQUE REFERENCES "Quote"("id"),
ADD COLUMN IF NOT EXISTS "serviceAgreementId" TEXT REFERENCES "ServiceAgreement"("id");

-- ============================================
-- Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_jobphoto_workOrderId ON "JobPhoto"("workOrderId");
CREATE INDEX IF NOT EXISTS idx_jobchecklistitem_workOrderId ON "JobChecklistItem"("workOrderId");
CREATE INDEX IF NOT EXISTS idx_vehiclelocationlog_vehicleId ON "VehicleLocationLog"("vehicleId");
CREATE INDEX IF NOT EXISTS idx_vehiclelocationlog_timestamp ON "VehicleLocationLog"("timestamp");
CREATE INDEX IF NOT EXISTS idx_routestop_vehicleId ON "RouteStop"("vehicleId");
CREATE INDEX IF NOT EXISTS idx_equipmentcheckout_workOrderId ON "EquipmentCheckout"("workOrderId");
CREATE INDEX IF NOT EXISTS idx_workorderitem_workOrderId ON "WorkOrderItem"("workOrderId");

-- ============================================
-- P2.1: Job Costing — add laborRate to Crew
-- ============================================
ALTER TABLE "Crew" ADD COLUMN IF NOT EXISTS "laborRate" DOUBLE PRECISION DEFAULT 75;

-- ============================================
-- P2.3: Multi-party Billing — BillingSplit table
-- ============================================
CREATE TABLE IF NOT EXISTS "BillingSplit" (
    "id" TEXT PRIMARY KEY,
    "workOrderId" TEXT NOT NULL REFERENCES "WorkOrder"("id") ON DELETE CASCADE,
    "partyName" TEXT NOT NULL,
    "partyType" TEXT NOT NULL DEFAULT 'TENANT',
    "splitPercent" DOUBLE PRECISION NOT NULL,
    "splitAmount" DOUBLE PRECISION,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "billingAddress" TEXT,
    "notes" TEXT,
    "invoiceId" TEXT UNIQUE REFERENCES "Invoice"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

-- Add billingType and billingNotes to WorkOrder
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "billingType" TEXT DEFAULT 'SINGLE';
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "billingNotes" TEXT;

CREATE INDEX IF NOT EXISTS idx_billingsplit_workOrderId ON "BillingSplit"("workOrderId");
CREATE INDEX IF NOT EXISTS idx_billingsplit_invoiceId ON "BillingSplit"("invoiceId");

-- ============================================
-- P2.6: Price Book — PriceItem table
-- ============================================
CREATE TABLE IF NOT EXISTS "PriceItem" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'LABOR',
    "unit" TEXT NOT NULL DEFAULT 'SQFT',
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_priceitem_category ON "PriceItem"("category");
CREATE INDEX IF NOT EXISTS idx_priceitem_active ON "PriceItem"("active");
