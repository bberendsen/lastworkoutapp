import WatchConnectivity

final class WatchSessionManager: NSObject, WCSessionDelegate {

    static let shared = WatchSessionManager()

    func start() {
        guard WCSession.isSupported() else {
            print("WCSession not supported")
            return
        }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        print("WCSession activated:", activationState.rawValue)
        if let error = error {
            print("WCSession activation error:", error.localizedDescription)
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        print("📩 Ontvangen van Watch:", message)
    }

}
