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
    const pageNumbers = createMemo(() => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 5;

        if (props.totalPages <= maxPagesToShow) {
            for (let i = 1; i <= props.totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            let startPage = Math.max(2, props.currentPage - Math.floor(maxPagesToShow / 2) + 1);
            let endPage = Math.min(props.totalPages - 1, props.currentPage + Math.floor(maxPagesToShow / 2) - 1);

            if (props.currentPage < maxPagesToShow - 1) {
                endPage = maxPagesToShow - 1;
            }
            if (props.currentPage > props.totalPages - (maxPagesToShow - 2)) {
                startPage = props.totalPages - (maxPagesToShow - 2);
            }

            if (startPage > 2) pages.push('...');
            for (let i = startPage; i <= endPage; i++) pages.push(i);
            if (endPage < props.totalPages - 1) pages.push('...');
            pages.push(props.totalPages);
        }

        return pages;
    });

    const paginationInfo = createMemo(() =>
        calculatePaginationInfo(props.currentPage, props.resultsPerPage, props.totalResults)
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= props.totalPages && newPage !== props.currentPage) {
            props.onPageChange(newPage);
        }
    };

    const handlePrevious = () => {
        const newPage = props.currentPage - 1;
        if (newPage >= 1) {
            props.onPageChange(newPage);
        }
    };

    const handleNext = () => {
        const newPage = props.currentPage + 1;
        if (newPage <= props.totalPages) {
            props.onPageChange(newPage);
        }
    };

    if (props.totalResults === 0 || props.totalPages <= 1) return null;

    return (
        <div class={props.containerClass || "flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-700 pt-4 mt-6"}>
            <div class="flex justify-between sm:hidden">
                <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={props.currentPage === 1}
                    class="rounded border px-3 py-2 text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Önceki
                </button>

                <span class="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                    {props.currentPage} / {props.totalPages}
                </span>

                <button
                    type="button"
                    onClick={handleNext}
                    disabled={props.currentPage === props.totalPages}
                    class="rounded border px-3 py-2 text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Sonraki
                </button>
            </div>

            <div class="hidden sm:flex sm:items-center sm:justify-between w-full">
                <Show when={props.showResultsInfo !== false}>
                    <div class="text-sm text-gray-600 dark:text-gray-300">
                        <span class="font-medium">{paginationInfo().startIndex}</span> -{' '}
                        <span class="font-medium">{paginationInfo().endIndex}</span> arası
                        gösteriliyor, toplam{' '}
                        <span class="font-medium">{props.totalResults}</span> sonuç
                    </div>
                </Show>

                <nav class="inline-flex rounded-md shadow-sm" aria-label="Pagination">
                    <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={props.currentPage === 1}
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
                                    type="button"
                                    onClick={() => handlePageChange(page as number)}
                                    class={
                                        props.currentPage === page
                                            ? 'px-3 py-2 text-sm border bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500'
                                            : 'px-3 py-2 text-sm border text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                                    }
                                    aria-current={props.currentPage === page ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            </Show>
                        )}
                    </For>

                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={props.currentPage === props.totalPages}
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