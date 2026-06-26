import { useAuthStore } from "../store/authStore";
import { BASE_URL } from "../defaultValues";


const getAuthHeaders = () => {
    return useAuthStore.getState().getAuthHeaders();
};

const request = async (
    url: string,
    options: RequestInit = {}
) => {
    const res = await fetch(`${BASE_URL}${url}`, {
        headers: {
            ...(options.headers || {}),
            ...getAuthHeaders(),
        },
        ...options,
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
};

const requestJSON = async (
    url: string,
    method: string,
    body?: any
) => {
    return request(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
};

/* ✅ AUTH */
export const signup = (data: {
    username: string;
    email: string;
    password: string;
}) => requestJSON("/auth/signup", "POST", data);

export const login = (data: {
    email: string;
    password: string;
}) => requestJSON("/auth/login", "POST", data);

export const getMe = () =>
    request("/auth/me");

export const updateUser = (data: any) =>
    requestJSON("/auth/user", "PUT", data);

export const deleteUser = () =>
    request("/auth/user", { method: "DELETE" });

/* ✅ PROJECT */

export const createProject = (data: {
    name: string;
}) => requestJSON("/projects", "POST", data);

export const getProjects = () =>
    request("/projects");

export const getProject = (projectId: string) =>
    request(`/projects/${projectId}`);

export const getPublicProject = (search = "") => request(`/projects/public?search=${encodeURIComponent(search)}`);

export const forkProject = (projectId: string) => request(`/projects/fork/${projectId}`, { method: "POST", });

export const updateProject = (
    projectId: string,
    data: any
) =>
    requestJSON(
        `/projects/${projectId}`,
        "PUT",
        data
    );

export const deleteProject = (projectId: string) =>
    request(`/projects/${projectId}`, {
        method: "DELETE",
    });

/* ✅ BRANCH */

export const getBranches = (projectId: string) => request(`/branch/${projectId}`);
export const createBranch = (projectId: string, data: { name: string, fromBranchId?: string }) => requestJSON(`/branch/${projectId}`, "POST", data);
export const deleteBranch = (branchId: string) => request(`/branch/${branchId}`, { method: "DELETE" });
export const pullLatest = (branchId: string) => request(`/branch/${branchId}/pull`);

/* ✅ COMMIT */

export const createCommit = (
    branchId: string,
    data: {
        state: any;
        message?: string;
        lastKnownVersion?: number;
    }
) =>
    requestJSON(
        `/commit/${branchId}`,
        "POST",
        data
    );

export const getCommits = (branchId: string) =>
    request(`/commit/${branchId}/commits`);

export const getCommit = (commitId: string) =>
    request(`/commits/${commitId}`);

export const deleteCommit = (commitId: string) =>
    request(`/commits/${commitId}`, {
        method: "DELETE",
    });

export const revertCommit = (commitId: string) =>
    request(`/commits/${commitId}/revert`, {
        method: "POST",
    });

/* ✅ AI GENERATION */

export const generateImage = async (formData: FormData) => {
    const res = await fetch(`${BASE_URL}/generate`, {
        method: "POST",
        headers: {
            ...getAuthHeaders(), // ✅ optional auth
        },
        body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Generation failed");
    }

    return data;
};

/* ✅ INVITES */
export const sendInvite = (
    projectId: string,
    data: { email: string }
) =>
    requestJSON(
        `/invite/${projectId}`,
        "POST",
        data
    );

export const acceptInvite = (inviteId: string) =>
    request(`/invite/accept/${inviteId}`, {
        method: "POST",
    });

export const rejectInvite = (inviteId: string) =>
    request(`/invite/reject/${inviteId}`, {
        method: "POST",
    });

export const cancelInvite = (inviteId: string) =>
    request(`/invites/${inviteId}`, {
        method: "DELETE",
    });

export const getInvites = () =>
    request(`/invites`);

export const removeCollaborator = (
    projectId: string,
    userId: string
) =>
    request(
        `/invite/remove_collaborator/${projectId}/id/${userId}`,
        {
            method: "DELETE",
        }
    );

export const getCollaborators = (projectId: string) =>
    request(`/invite/project_collaborators/${projectId}`);

/* ✅ NOTIFICATIONS */
export const getNotifications = () => request(`/notification`);

export const getUnreadCount = () => request(`/notifications/unread/count`);

export const markAsRead = (id: string) => request(`/notification/${id}/read`, { method: "PUT", });

export const markAllRead = () =>
    request(`/notification/read/all`, {
        method: "PUT",
    });

export const deleteNotification = (id: string) =>
    request(`/notifications/${id}`, {
        method: "DELETE",
    });

export const deleteAllNotifications = () =>
    request(`/notifications`, {
        method: "DELETE",
    });

/* ✅ PULL REQUESTS */
/* ✅ PULL REQUEST APIs */

export const createPR = (data: {
    projectId: string;
    fromBranchId: string;
    toBranchId: string;
    title: string;
}) =>
    requestJSON("/pull_request", "POST", data);

export const getPRs = (projectId: string) =>
    request(`/pull_request/${projectId}/all`);

export const acceptPR = (id: string) =>
    request(`/pull_request/accept/${id}`, {
        method: "POST",
    });

export const rejectPR = (id: string) =>
    request(`/pull_request/reject/${id}`, {
        method: "POST",
    });