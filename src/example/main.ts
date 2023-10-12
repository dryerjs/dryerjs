import { ReflectiveInjector, Injectable } from 'injection-js';
import { dryer } from './app';

@Injectable()
class Http {
    async request(url: string) {
        console.log({ url });
        return { result: 10 }
    }
}

@Injectable()
class Service {
  constructor(private readonly http: Http) {}

  async getTemp(city: string) {
    const { result } = await this.http.request(city);
    console.log({ result });
    return result;
  }
}

const injector = ReflectiveInjector.resolveAndCreate([Service, Http]);

injector.get(Service).getTemp('London').then(console.log);

dryer.start();
