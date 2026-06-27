export type projectType = {
    collaborators: collaboratorsType[],
    createdAt: string,
    forkedFrom: string,
    liveBranch: string,
    name: string,
    updatedAt: string,
    visibility: string,
    _id: string,
    __v: number,
    owner: OwnerType
}
export type OwnerType = {
    email: string,
    username: string,
    _id: string
}
export type collaboratorsType = {
    username: string
}