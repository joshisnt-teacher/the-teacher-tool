import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PresentationWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Renders `children` into a separate, real browser window (not an iframe) so a
// teacher can drag it onto a projector/second display while keeping the main
// dashboard on their own screen — same idea as the timer/name-picker popups,
// but React-rendered (via portal) instead of a static document.write() string,
// since slide content needs to update live as the teacher navigates.
export function PresentationWindow({ isOpen, onClose, title, children }: PresentationWindowProps) {
  const windowRef = useRef<Window | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }
      windowRef.current = null;
      setContainer(null);
      return;
    }

    const width = window.screen.availWidth;
    const height = window.screen.availHeight;
    const newWindow = window.open("", "lesson-presentation", `width=${width},height=${height},left=0,top=0`);

    if (!newWindow) {
      onCloseRef.current();
      return;
    }

    newWindow.document.title = title ?? "Presentation";
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      newWindow.document.head.appendChild(node.cloneNode(true));
    });

    const root = newWindow.document.createElement("div");
    root.id = "presentation-root";
    newWindow.document.body.style.margin = "0";
    newWindow.document.body.appendChild(root);

    windowRef.current = newWindow;
    setContainer(root);

    const handleUnload = () => onCloseRef.current();
    newWindow.addEventListener("beforeunload", handleUnload);

    const pollClosed = window.setInterval(() => {
      if (newWindow.closed) {
        window.clearInterval(pollClosed);
        onCloseRef.current();
      }
    }, 1000);

    return () => {
      window.clearInterval(pollClosed);
      newWindow.removeEventListener("beforeunload", handleUnload);
      if (!newWindow.closed) newWindow.close();
      windowRef.current = null;
    };
  }, [isOpen, title]);

  if (!container) return null;
  return createPortal(children, container);
}
