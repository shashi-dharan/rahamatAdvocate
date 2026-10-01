import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaTimes } from "react-icons/fa";

const DisclaimerModal = () => {
  const [dismissedPath, setDismissedPath] = useState(null);
  const location = useLocation();
  const isOpen = dismissedPath !== location.pathname;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleAgree = () => {
    setDismissedPath(location.pathname);
  };

  const handleClose = () => {
    setDismissedPath(location.pathname);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 bg-black/60 flex items-center justify-center overflow-y-auto p-4">
      <div className="bg-white w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden shadow-xl p-6">
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close disclaimer"
            className="-ml-2 -mt-2 mb-2 inline-flex size-9 items-center justify-center text-gray-700 hover:bg-gray-100"
          >
            <FaTimes aria-hidden="true" size={20} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <p className="text-gray-900 text-[16px] leading-7 font-normal">
            As per the rules of the Bar Council of India, we are not permitted to
            solicit work and advertise. By clicking on the &ldquo;I AGREE&rdquo;
            button below, you acknowledge the following:
          </p>
          <p className="text-gray-900 text-[16px] leading-6 font-normal mt-1">
            there has been no advertisement, personal communication, solicitation,
            invitation or inducement of any sort whatsoever from us or any of our
            members to solicit any work through this website;
          </p>
          <p className="text-gray-900 text-[16px] leading-6 font-normal mt-1">
            you wish to gain more information about us for your own information
            and use;
          </p>
          <p className="text-gray-900 text-[16px] leading-6 font-normal mt-1">
            the information about us is provided to you on your specific request
            and any information obtained or materials downloaded from this website
            is completely at your own volition and any transmission, receipt or
            use of this site does not create any lawyer-client relationship; and
            that
          </p>
          <p className="text-gray-900 text-[16px] leading-6 font-normal mt-1">
            we are not liable for any consequence of any action taken by you
            relying on the material / information provided on this website.
          </p>
          <p className="text-gray-900 text-[16px] leading-6 font-normal mt-1">
            If you have any legal issues, you, in all cases, must seek independent
            legal advice.
          </p>

          <div className="mt-6 text-center">
            <button
              onClick={handleAgree}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm tracking-wide px-10 py-3"
            >
              YES I AGREE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
