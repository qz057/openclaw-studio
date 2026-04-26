export type OperationResultStatus = "success" | "error" | "info";

export interface OperationResultState {
  status: OperationResultStatus;
  summary: string;
  nextStep: string;
  updatedAt: number;
  detail?: string | null;
}

interface OperationResultPanelProps {
  label: string;
  result: OperationResultState | null;
  emptySummary: string;
  emptyNextStep: string;
}

function formatOperationTime(updatedAt: number): string {
  const diffMs = Date.now() - updatedAt;

  if (diffMs < 60_000) {
    return "刚刚";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} 小时前`;
}

export function OperationResultPanel({ label, result, emptySummary, emptyNextStep }: OperationResultPanelProps) {
  const status = result?.status ?? "info";

  return (
    <div className={`operation-result operation-result--${status}`}>
      <div className="operation-result__header">
        <span>{label}</span>
        <strong>{result?.summary ?? emptySummary}</strong>
      </div>
      {result?.detail ? <p>{result.detail}</p> : null}
      <div className="operation-result__footer">
        <span>下一步：{result?.nextStep ?? emptyNextStep}</span>
        <em>最近一次操作：{result ? formatOperationTime(result.updatedAt) : "暂无"}</em>
      </div>
    </div>
  );
}
