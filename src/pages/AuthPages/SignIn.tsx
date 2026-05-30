import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";
import { useEffect } from "react";

export default function SignIn() {
  useEffect(() => {
    document.title = "Sign In";
  }, []);
  
  return (
    <>
      <PageMeta
        title="Sign In"
        description=""
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
