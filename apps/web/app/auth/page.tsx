import { Card, CardContent, CardHeader } from "ui";
import { GoogleAuth } from "./GoogleAuth";

const AuthPage = () => {
  return (
    <Card className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] my-6 md:my-20">
      <CardHeader className="text-xl font-semibold">Sign in</CardHeader>
      <CardContent>
        <GoogleAuth />
      </CardContent>
    </Card>
  );
};

export default AuthPage;
