-- Add a country to the booking-header "Final Destination" routing field, mirroring
-- the existing place_of_loading_city / place_of_loading_country pairing.

ALTER TABLE bookings
  ADD COLUMN final_destination_country VARCHAR(10) NULL AFTER final_destination;
