# Password-Manager
## Project Overview

This project is a secure password manager that allows users to safely store, retrieve, and manage their passwords for various websites. Implemented using JavaScript, this password manager encrypts sensitive data to ensure security and integrity, thus preventing unauthorized access and providing resilience against potential attacks such as rollback and swap attacks. It is particularly relevant in today's digital landscape, where secure password storage and management are essential due to the increasing prevalence of online services and the constant risk of cybersecurity threats. This project employs strong encryption practices to protect stored passwords while ensuring user data integrity and confidentiality.

---

## Implementation Short-Answer Questions

1. **. Briefly describe your method for preventing the adversary from learning information about
the lengths of the passwords stored in your password manager.**  
   To prevent the adversary from learning information about the lengths of the passwords stored, the system encrypts passwords using AES-GCM with a fixed IV length, adding padding if necessary to standardize the size of all stored encrypted values. This approach ensures that password lengths are not discernible based on ciphertext length, as all encrypted entries appear to have a consistent length in storage.

2. **. Briefly describe your method for preventing swap attacks (Section 2.2). Provide an argument for
why the attack is prevented in your scheme.**  
   The use of AES-GCM encryption with unique, random initialization vectors (IVs) for each password entry helps mitigate swap attacks by ensuring that even identical plaintext passwords do not produce identical ciphertexts. This randomness makes it difficult for an adversary to identify or swap password entries successfully. Furthermore, the use of a cryptographic checksum upon loading the data (through SHA-256 hashing) allows the password manager to detect unauthorized modifications, which helps prevent swap attacks.

3. **In our proposed defense against the rollback attack (Section 2.2), we assume that we can store
the SHA-256 hash in a trusted location beyond the reach of an adversary. Is it necessary to
assume that such a trusted location exists, in order to defend against rollback attacks? Briefly
justify your answer.**  
   It is not strictly necessary to store the SHA-256 hash in a trusted location to defend against rollback attacks, provided the system can maintain a cryptographic history of stored states. An alternative approach is to use a combination of nonces or counters along with hash verification, which would invalidate older versions and prevent rollbacks. However, without a trusted location, it is challenging to guarantee that even these measures could not be tampered with; thus, a trusted storage location remains the most reliable defense.

4. **Because HMAC is a deterministic MAC (that is, its output is the same if it is run multiple
times with the same input), we were able to look up domain names using their HMAC values.
There are also randomized MACs, which can output different tags on multiple runs with the
same input. Explain how you would do the look up if you had to use a randomized MAC
instead of HMAC. Is there a performance penalty involved, and if so, what?**  
   If a randomized MAC (such as a probabilistic MAC) is used, it would not be feasible to use the MAC output for efficient domain name lookups directly because each query would yield a different tag for the same domain, leading to lookup inconsistency. To adapt, we could store domain names in a searchable, encrypted database where each entry is indexed with a unique, deterministic identifier generated during the initial MAC computation. This approach would introduce a performance penalty due to the need for additional storage and indexing to handle randomized MAC outputs reliably.

5. **In our specification, we leak the number of records in the password manager. Describe an
approach to reduce the information leaked about the number of records. Specifically, if there
are k records, your scheme should only leak log2(k) (that is, if k1 and k2 are such that log2(k1)
= log2(k2) , the attacker should not be able to distinguish between a case where the true
number of records is k1 and another case where the true number of records is k2).**  
   To reduce information leakage regarding the number of stored records, we could implement a scheme where the password manager groups records into blocks and only reveals the logarithmic size of the record set. For example, if there are `k` records, we could create blocks with sizes that are powers of 2, such as 1, 2, 4, 8, and so on. This means that an adversary would only observe the range of records, effectively learning `log2(k)` rather than the precise record count. By dynamically adjusting block sizes, the attacker would not be able to distinguish between close values, reducing leakage.

6. **What is a way we can add multi-user support for specific sites to our password manager
system without compromising security for other sites that these users may wish to store
passwords of? That is, if Alice and Bob wish to access one stored password (say for nytimes)
that either of them can get and update, without allowing the other to access their passwords
for other websites.**  
   To support multi-user access for specific sites while ensuring security across different users’ data, the password manager could assign unique encryption keys for each shared site, with permissions specified for each authorized user. In this case, Alice and Bob could share access to the encrypted password for `nytimes.com` by storing it in a shared "vault" where each user’s access to the vault is verified using public-private key pairs. Access to other passwords would be restricted by individual encryption keys, ensuring that shared access to one password does not compromise other unrelated entries.


## Essential Features and Real-World Application

This password manager demonstrates key principles of modern secure data storage, such as **confidentiality, integrity, and access control**, which are crucial for personal and organizational security. In an era where personal and professional interactions frequently occur online, protecting sensitive login information is essential to prevent unauthorized access and data breaches. By leveraging encryption techniques and hashing mechanisms, this project offers a model of secure, reliable password management that could be extended or adapted to more extensive security systems, including multi-user enterprise environments and collaborative systems requiring secure shared access to specific information.
