-- Add toggle to control whether accentColor applies to dataroom viewer
ALTER TABLE "DataroomBrand"
ADD COLUMN "applyAccentColorToDataroomView" BOOLEAN NOT NULL DEFAULT false;

-- Add global toggle to control whether accentColor applies to dataroom viewer by default
ALTER TABLE "Brand"
ADD COLUMN "applyAccentColorToDataroomView" BOOLEAN NOT NULL DEFAULT false;
