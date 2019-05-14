export type Dictionary<T> = { [key: string]: T };

export class Resolver<T> {
  resolvers: Dictionary<Dictionary<T>>;

  constructor(resolvers: Dictionary<Dictionary<T>>) {
    this.resolvers = resolvers;
  }

  public getResolver(protocol: string, application: string): T {
    return this.resolvers[protocol][application];
  }

  // Eg: holo://DNA_HASH/PERSP_ID
  public resolver(link: string) {
    const [protocol, path] = link.split('://');

    const [application, address] = path.split('/');
    
  }
}
