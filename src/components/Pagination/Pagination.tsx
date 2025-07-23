import { For, createMemo, Show } from 'solid-js';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    onPageChange: (page: number) => void;
    resultsPerPage: number;
    showResultsInfo?: boolean;
    containerClass?: string;
}

export interface PaginationInfo {
    startIndex: number;
    endIndex: number;
    totalResults: number;
    currentPage: number;
    totalPages: number;
}

export const calculatePaginationInfo = (
    currentPage: number,
    resultsPerPage: number,
    totalResults: number
): PaginationInfo => {
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const startIndex = (currentPage - 1) * resultsPerPage + 1;
    const endIndex = Math.min(currentPage * resultsPerPage, totalResults);

    return {
        startIndex,
        endIndex,
        totalResults,
        currentPage,
        totalPages,
    };
};

const Pagination = (props: PaginationProps) => {
    const {
        currentPage,
        totalPages,
        totalResults,
        onPageChange,
        resultsPerPage,
        showResultsInfo = true,
        containerClass = "flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-700 pt-4 mt-6",
    } = props;

    const pageNumbers = createMemo(() => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2) + 1);
            let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxPagesToShow / 2) - 1);

            if (currentPage < maxPagesToShow - 1) {
                endPage = maxPagesToShow - 1;
            }
            if (currentPage > totalPages - (maxPagesToShow - 2)) {
                startPage = totalPages - (maxPagesToShow - 2);
            }

            if (startPage > 2) pages.push('...');
            for (let i = startPage; i <= endPage; i++) pages.push(i);
            if (endPage < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    });

    const paginationInfo = createMemo(() =>
        calculatePaginationInfo(currentPage, resultsPerPage, totalResults)
    );

    if (totalResults === 0 || totalPages <= 1) return null;

    return (
        <div class={containerClass}>
            {/* Mobil görünüm */}
            <div class="flex justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    class="rounded border px-3 py-2 text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Önceki
                </button>

                <span class="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
          {currentPage} / {totalPages}
        </span>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    class="rounded border px-3 py-2 text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Sonraki
                </button>
            </div>

            {/* Masaüstü görünüm */}
            <div class="hidden sm:flex sm:items-center sm:justify-between w-full">
                <Show when={showResultsInfo}>
                    <div class="text-sm text-gray-600 dark:text-gray-300">
                        <span class="font-medium">{paginationInfo().startIndex}</span> -{' '}
                        <span class="font-medium">{paginationInfo().endIndex}</span> arası
                        gösteriliyor, toplam{' '}
                        <span class="font-medium">{totalResults}</span> sonuç
                    </div>
                </Show>

                <nav class="inline-flex rounded-md shadow-sm" aria-label="Pagination">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        class="rounded-l-md px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Önceki"
                    >
                        ←
                    </button>

                    <For each={pageNumbers()}>
                        {(page) => (
                            <Show
                                when={typeof page === 'number'}
                                fallback={
                                    <span class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                    ...
                  </span>
                                }
                            >
                                <button
                                    onClick={() => onPageChange(page as number)}
                                    class={`px-3 py-2 text-sm border ${
                                        currentPage === page
                                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                                            : 'text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                    } border-gray-300 dark:border-gray-600`}
                                    aria-current={currentPage === page ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            </Show>
                        )}
                    </For>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        class="rounded-r-md px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Sonraki"
                    >
                        →
                    </button>
                </nav>
            </div>
        </div>
    );
};

export default Pagination;
