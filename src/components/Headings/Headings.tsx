import { JSX } from "solid-js";

type HeadingProps = {
    title: string;
    description?: string;
    children?: JSX.Element;
};

export default function Heading(props: HeadingProps) {
    return (
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <div>
                <h1 class="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                    {props.title}
                </h1>
                {props.description && (
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {props.description}
                    </p>
                )}
            </div>
            <div class="mt-4 sm:mt-0 flex gap-2 items-center">{props.children}</div>
        </div>
    );
}
