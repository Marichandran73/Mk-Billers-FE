const LoadingComp = ({ Color = "#0f84c8", height = "420px" }) => {
  return (
    <div
      style={{ height }}
      className="panel-surface mb-3 flex items-center justify-center"
    >
      <div
        style={{ borderTopColor: Color }}
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300"
      ></div>
    </div>
  );
};

export default LoadingComp;
