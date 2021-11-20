import Named from '../types/Named';

abstract class AbstractNamed implements Named {
  protected abstract readonly nameSuffix: string;

  public getName(): string {
    // By default, use the snake cased class name as name (with the name suffix removed)
    let className = this.constructor.name;

    // Remove the "Command" suffix if set
    if (className.endsWith(this.nameSuffix)) {
      className = className.substring(0, className.length - this.nameSuffix.length);
    }

    // Make sure the first letter is already lowercase
    className = className[0].toLowerCase() + className.substring(1);

    // Now turn into snake case and return it
    return className.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }
}

export default AbstractNamed;
