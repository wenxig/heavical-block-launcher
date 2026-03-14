const idMap: Record<string, string> = {}
export const useAtomStore = () => {
  return {
    create(path: string) {
      const id = String(Object.keys(idMap).length + 1)
      const url = `atom://atom.id/${id}`
      idMap[id] = path
      return url
    },
    get(url: string) {
      const id = url.match(/\d+/g)?.[0]!
      return idMap[id]
    }
  }
}