declare namespace chrome {
  namespace runtime {
    const lastError: { message?: string } | undefined;
    const onMessage: {
      addListener(
        callback: (
          message: any,
          sender: { tab?: { id?: number } },
          sendResponse: (response?: any) => void
        ) => void | boolean
      ): void;
    };
  }

  namespace tabs {
    function query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Array<{ id?: number }>>;
    function sendMessage(tabId: number, message: any): Promise<any>;
    function sendMessage(tabId: number, message: any, callback: (response: any) => void): void;
  }

  namespace storage {
    namespace local {
      function get(key: string): Promise<Record<string, unknown>>;
      function set(items: Record<string, unknown>): Promise<void>;
    }
  }
}
