import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";
import { useEffect } from "react";

export default function SignUp() {
  useEffect(() => {
    document.title = "Sign Up";
  }, []);
  
  return (
    <>
      <PageMeta
        title="Sign Up"
        description=""
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
