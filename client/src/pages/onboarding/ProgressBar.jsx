const ProgressBar = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">
            Step {Math.min(current + 1, total)} of {total}
          </p>
          <p className="text-sm font-medium text-gray-600">{Math.round(percentage)}%</p>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
