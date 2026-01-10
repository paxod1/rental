import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearToast } from "../../store/slices/toastSlice";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

export default function GlobalToast() {
    const dispatch = useDispatch();
    const { message, type, timestamp } = useSelector((state) => state.toast);

    useEffect(() => {
        if (message && type && timestamp) {
            const toastOptions = {
                duration: 2000,
                position: "top-center",
                dismissible: true,
                closeButton: true,
                icon: null,
            };

            const title = type.charAt(0).toUpperCase() + type.slice(1);

            switch (type) {
                case "success":
                    toast.success(
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <p className="font-bold text-green-600">{title}!</p>
                                <p className="text-[14px] text-gray-600">{message}</p>
                            </div>
                        </div>,
                        { ...toastOptions }
                    );
                    break;
                case "error":
                    toast.error(
                        <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-600">{title}!</p>
                                <p className="text-[14px] text-red-600">{message}</p>
                            </div>
                        </div>,
                        { ...toastOptions }
                    );
                    break;
                case "warning":
                    toast.warning(
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                                <p className="font-bold text-yellow-600">{title}!</p>
                                <p className="text-[14px] text-yellow-600">{message}</p>
                            </div>
                        </div>,
                        { ...toastOptions }
                    );
                    break;
                case "info":
                    toast.info(
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="font-bold text-blue-600">{title}!</p>
                                <p className="text-[14px] text-blue-600">{message}</p>
                            </div>
                        </div>,
                        { ...toastOptions }
                    );
                    break;
                default:
                    toast(message, { ...toastOptions });
            }

            dispatch(clearToast());
        }
    }, [message, type, timestamp, dispatch]);

    return null;
}
