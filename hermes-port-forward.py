#!/usr/bin/env python3
"""
Simple TCP port forwarder for Hermes gateway
Forwards 0.0.0.0:8765 -> 127.0.0.1:8765
"""
import socket
import threading
import sys

def forward(source, destination):
    """Forward data from source to destination"""
    try:
        while True:
            data = source.recv(4096)
            if not data:
                break
            destination.sendall(data)
    except Exception as e:
        pass
    finally:
        source.close()
        destination.close()

def handle_client(client_socket):
    """Handle a client connection"""
    try:
        # Connect to the real Hermes gateway
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.connect(('127.0.0.1', 8765))

        # Start bidirectional forwarding
        client_to_server = threading.Thread(target=forward, args=(client_socket, server_socket))
        server_to_client = threading.Thread(target=forward, args=(server_socket, client_socket))

        client_to_server.start()
        server_to_client.start()

        client_to_server.join()
        server_to_client.join()
    except Exception as e:
        print(f"Error handling client: {e}", file=sys.stderr)
        client_socket.close()

def main():
    """Main server loop"""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', 8765))
    server.listen(5)

    print("Hermes port forwarder listening on 0.0.0.0:8765")
    print("Forwarding to 127.0.0.1:8765")

    try:
        while True:
            client_socket, addr = server.accept()
            print(f"Connection from {addr}")
            client_thread = threading.Thread(target=handle_client, args=(client_socket,))
            client_thread.daemon = True
            client_thread.start()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        server.close()

if __name__ == '__main__':
    main()
