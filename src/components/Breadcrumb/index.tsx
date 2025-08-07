import React from "react";
import { Breadcrumb } from "antd";
interface BreadcrumbProps {
  items: {
    title: string | React.ReactNode;
    href?: string;
  }[];
  style?: React.CSSProperties;
}
const BreadcrumbComponent: React.FC<BreadcrumbProps> = ({ items, style }) => {
  return <Breadcrumb items={items} style={{ fontSize: 16, ...style }} />;
};

export default BreadcrumbComponent;
