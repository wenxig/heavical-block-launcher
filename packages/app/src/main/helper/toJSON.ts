export const injectToJSON = () => {
  Error.prototype.toJSON = function () {
    return this.stack ?? this.message
  }
  Map.prototype.toJSON = function () {
    return Object.fromEntries(this.entries())
  }
  Set.prototype.toJSON = function () {
    return Array.from(this.values())
  }
}