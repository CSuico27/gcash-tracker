import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../supabase/SupabaseClient";

export default function ConfirmEmail() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type");

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type: "signup" }).then(({ error }) => {
        if (error) {
          console.error("Confirmation error:", error.message);
          navigate("/signin");
        } else {
          navigate("/home"); // diretso dashboard
        }
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}