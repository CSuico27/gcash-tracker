import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../supabase/SupabaseClient";
import Spinner from "../../components/ui/spinner/Spinner";

export default function ConfirmEmail() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type");

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type: "signup" }).then(({ error }) => {
        if (error) {
          navigate("/signin");
        } else {
          navigate("/home");
        }
      });
    } else {
      navigate("/signin");
    }
  }, []);

  return (
    <Spinner fullScreen />
  );
}