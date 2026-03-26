 <div key={leave._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">

            <div className={`h-1 bg-orange-500`}></div>

            <div className="p-3 sm:p-4">

              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0`}>
                    {leave.ad}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{leave.name}</h3>
                    <p className="text-xs text-gray-500">Class {leave.classNum}</p>
                  </div>
                </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => actionButtonHandle(leave, 'markReturn')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-sm sm:text-sm font-medium bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        'Remove'
                      )}
                    </button>
                  </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1">

                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-100 whitespace-nowrap">
                        <Calendar size={10} className="text-blue-600" />
                        <span className="text-xs text-gray-900">{formatDate(leave.fromDate)}</span>
                        <span className="text-xs text-blue-600">{formatTime(leave.fromTime)}</span>
                      </div>
                    </div>

                  

                  </div>

              </div>

              {/* Teacher & Reason */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-gray-100">
                {leave.teacher && (
                  <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    <FileSignature size={12} />
                    <span className="font-medium">{leave.teacher}</span>
                  </div>
                )}

                {leave.reason && (
                  <div className="items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    <span className="truncate italic">{leave.reason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>