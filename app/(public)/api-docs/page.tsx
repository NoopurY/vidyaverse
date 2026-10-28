"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { SkeletonRows } from "@/components/ui";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false, loading: () => <SkeletonRows rows={8} /> });

export default function ApiDocs() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <h1 className="page-title">API documentation</h1>
      <p className="mt-1 text-sm text-muted">OpenAPI 3 specification for institution ERPs and AICTE integrations. Raw spec: /api/openapi</p>
      <div className="mt-4 rounded border border-line bg-white">
        <SwaggerUI url="/api/openapi" docExpansion="list" defaultModelsExpandDepth={0} />
      </div>
    </div>
  );
}
