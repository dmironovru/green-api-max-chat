import { useState, type FormEvent } from 'react';
import { deriveApiUrl } from '../config';
import type { Credentials } from '../types';
import { LogoIcon } from './icons';

interface LoginFormProps {
  onSubmit: (credentials: Credentials) => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const id = idInstance.trim();
    const token = apiTokenInstance.trim();
    if (!id || !token) {
      setError('Заполните idInstance и apiTokenInstance.');
      return;
    }
    onSubmit({
      idInstance: id,
      apiTokenInstance: token,
      apiUrl: (apiUrl.trim() || deriveApiUrl(id)).replace(/\/+$/, ''),
    });
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo" aria-hidden="true"><LogoIcon /></div>
        <h1>GREEN-API Chat</h1>
        <p className="sub">Отправка и получение текстовых сообщений в MAX через GREEN-API</p>

        <div className="field">
          <label htmlFor="idInstance">idInstance</label>
          <input id="idInstance" value={idInstance} autoComplete="off" inputMode="numeric"
            onChange={(e) => setIdInstance(e.target.value)} placeholder="310022743336" />
        </div>

        <div className="field">
          <label htmlFor="apiTokenInstance">apiTokenInstance</label>
          <input id="apiTokenInstance" type="password" value={apiTokenInstance} autoComplete="off"
            onChange={(e) => setApiTokenInstance(e.target.value)} placeholder="919c2509… (60 символов)" />
        </div>

        <div className="field">
          <label htmlFor="apiUrl">apiUrl — необязательно, подставится из idInstance</label>
          <input id="apiUrl" value={apiUrl} autoComplete="off"
            onChange={(e) => setApiUrl(e.target.value)} placeholder="https://3100.api.green-api.com" />
        </div>

        <button className="btn" type="submit">Подключиться</button>
        {error && <p className="form-error">{error}</p>}

        <p className="login-hint">
          Значения копируются из карточки инстанса в{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">кабинете GREEN-API</a>.
          Поле apiUrl можно оставить пустым — хост выведется из первых цифр idInstance.
          Данные хранятся только в вашем браузере.
        </p>
      </form>
    </div>
  );
}
