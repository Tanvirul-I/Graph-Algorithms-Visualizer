import React from "react";

interface ModalProps {
        title: string;
        onClose: () => void;
        children: React.ReactNode;
}

const overlayStyle: React.CSSProperties = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        zIndex: 1000,
};

const containerStyle: React.CSSProperties = {
        width: "320px",
        maxWidth: "90%",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.18)",
        overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        backgroundColor: "#1976d2",
        color: "#ffffff",
};

const bodyStyle: React.CSSProperties = {
        padding: "16px",
};

const closeButtonStyle: React.CSSProperties = {
        border: "none",
        background: "transparent",
        color: "#ffffff",
        fontSize: "18px",
        cursor: "pointer",
        lineHeight: 1,
};

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
        return (
                <div style={overlayStyle} role="dialog" aria-modal="true">
                        <div style={containerStyle}>
                                <div style={headerStyle}>
                                        <h3 style={{ margin: 0, fontSize: "18px" }}>{title}</h3>
                                        <button
                                                type="button"
                                                onClick={onClose}
                                                style={closeButtonStyle}
                                                aria-label="Close dialog"
                                        >
                                                ×
                                        </button>
                                </div>
                                <div style={bodyStyle}>{children}</div>
                        </div>
                </div>
        );
};

export default Modal;
