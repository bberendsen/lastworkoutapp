import SwiftUI
import WatchConnectivity

struct ContentView: View {
    
    var body: some View {
        VStack {
            Button("Test Message") {
                sendTestMessage()
            }
        }
        .onAppear {
            WatchSessionManager.shared.start()
        }
    }
    
    // MARK: - Functie om testbericht te sturen
    func sendTestMessage() {
        if WCSession.default.isReachable {
            let message = ["value": 1]
            WCSession.default.sendMessage(message, replyHandler: nil) { error in
                print("❌ Error sending message:", error.localizedDescription)
            }
            print("📤 Test message sent")
        } else {
            print("❌ iPhone not reachable")
        }
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
