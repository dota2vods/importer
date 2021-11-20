class ImportError extends Error {
  private readonly exitCode: number;

  constructor(message?: string, exitCode = 1) {
    super(message);

    this.exitCode = exitCode;
  }

  public getExitCode(): number {
    return this.exitCode;
  }
}

export default ImportError;
