import { AppHeader, IconButton } from "./StaffUI";
import LanguageButton from "../i18n/LanguageButton";
import { useAuth } from "../context/AuthContext";
import { t } from "../i18n";

// Header for the finance section's screens. `actions` are extra icon buttons
// ({ icon, onPress, label }) shown before the language and log-out buttons.
export const FinanceHeader = ({ title, actions = [], onBack }) => {
  const { finance, financeLogout } = useAuth();
  return (
    <AppHeader
      title={title}
      subtitle={`${t("Maaliyadda ·")} ${finance?.fullName || ""}`}
      onBack={onBack}
      actions={
        <>
          {actions.map((a) => (
            <IconButton key={a.icon} name={a.icon} onPress={a.onPress} label={a.label} />
          ))}
          <LanguageButton light />
          <IconButton name="log-out-outline" onPress={financeLogout} label="Log out" />
        </>
      }
    />
  );
};
