import React from "react";

interface AccordionSectionProps {
        title: string;
        isOpen: boolean;
        onToggle: () => void;
        children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
        title,
        isOpen,
        onToggle,
        children,
}) => {
        return (
                <section style={{ marginBottom: "24px" }}>
                        <button
                                onClick={onToggle}
                                style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "12px 16px",
                                        backgroundColor: "#f5f7fa",
                                        border: "1px solid #d3d8de",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                }}
                        >
                                <span>{title}</span>
                                <span style={{ fontSize: "12px", color: "#52606d" }}>
                                        {isOpen ? "▲" : "▼"}
                                </span>
                        </button>
                        {isOpen && (
                                <div
                                        style={{
                                                padding: "16px",
                                                border: "1px solid #d3d8de",
                                                borderTop: "none",
                                                borderRadius: "0 0 6px 6px",
                                                marginTop: "-1px",
                                        }}
                                >
                                        {children}
                                </div>
                        )}
                </section>
        );
};

export default AccordionSection;
