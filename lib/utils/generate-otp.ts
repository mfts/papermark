export function generateOTP(): string {
  // Generate a random number between 0 and 999999
  const randomNumber = Math.floor(Math.random() * 1000000);

  // Pad the number with leading zeros if necessary to ensure it is always 6 digits
  const otp = randomNumber.toString().padStart(6, "0");

  return otp;
}
