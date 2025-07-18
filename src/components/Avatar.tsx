import { For } from "solid-js";
import studentAvatar from "../../public/avatar.png";
import defaultAvatar from "../../public/avatar1.png";

export default function Avatar(props:{isStudent: boolean[]}){
    return(
        <div class="fixed top-2 right-6 w-10 h-10">
            <For each={props.isStudent}>
                {(isStudent) =>{
                    const displayedAvatar=isStudent ? studentAvatar : defaultAvatar;
                    return(
                        <div class="w-full h-full rounded-full overflow-hidden">
                            <img
                                src={displayedAvatar}
                                class="w-full h-full object-cover"
                                alt="avatar"
                            />
                        </div>
                    );
                }}
            </For>
        </div>
    );
}
