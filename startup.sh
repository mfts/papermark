echo "Waiting for database to be ready..."
until nc -z -v -w30 db 5432
do
  echo "Waiting for database connection..."
  sleep 5
done

echo "Database is up. Running migrations..."
npx prisma migrate deploy

echo "Starting the app..."
exec npm start