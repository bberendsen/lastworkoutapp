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

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        print("WCSession activated:", activationState.rawValue)
        if let error = error {
            print("WCSession error:", error)
        }
    }

    func session(
        _ session: WCSession,
        didReceiveMessage message: [String : Any]
    ) {
        print("📩 Ontvangen van Watch:", message)
    }
}
